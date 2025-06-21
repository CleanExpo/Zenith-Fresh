// src/lib/services/gmb.ts

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/redis';

// Configuration
const GMB_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GMB_ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const DEFAULT_CACHE_TTL = 300; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

interface ApiError extends Error {
    status?: number;
    code?: string;
}

/**
 * Executes an asynchronous operation with retries using exponential backoff and jitter.
 *
 * Retries the operation up to the specified number of attempts, increasing the delay between attempts exponentially. Does not retry if the error status is 401 or 403. Throws the last encountered error if all attempts fail.
 *
 * @param operation - The asynchronous operation to execute
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds before retrying (default: 500)
 * @returns The result of the successful operation
 */
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = MAX_RETRY_ATTEMPTS,
    delay: number = RETRY_DELAY_MS
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry on authentication errors
            if ((error as ApiError).status === 401 || (error as ApiError).status === 403) {
                throw error;
            }
            
            // Don't retry on the last attempt
            if (attempt === maxAttempts) {
                break;
            }
            
            // Exponential backoff with jitter
            const backoffDelay = delay * Math.pow(2, attempt - 1) + Math.random() * 100;
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
    }
    
    throw lastError!;
}

/**
 * Returns a valid OAuth access token for the given Google account, refreshing it if it is expiring within five minutes.
 *
 * If the token is near expiry, requests a new access token using the refresh token and updates the account in the database. Throws an error if the refresh fails.
 *
 * @returns The valid access token for the account
 */
async function refreshTokenIfNeeded(account: any): Promise<string> {
    const now = Date.now();
    const tokenExpiry = account.expires_at ? account.expires_at * 1000 : 0;
    
    // Refresh if token expires within 5 minutes
    if (tokenExpiry - now < 300000) {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID!,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                    refresh_token: account.refresh_token!,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const tokenData = await response.json();
            
            // Update the account with new token
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    access_token: tokenData.access_token,
                    expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
                },
            });

            return tokenData.access_token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw new Error('Authentication failed. Please reconnect your Google account.');
        }
    }
    
    return account.access_token;
}

/**
 * Retrieves the authenticated user's Google My Business credentials, ensuring a valid access token and required GMB configuration.
 *
 * Throws an error if the user is not authenticated, the Google account is not connected, or GMB is not configured.
 * Refreshes the OAuth token if it is near expiration.
 *
 * @returns An object containing the access token, account ID, GMB account and location IDs, and their display names.
 */
async function getGmbAuth() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            provider: 'google',
        }
    });

    if (!account || !account.access_token) {
        throw new Error("Google account not connected for this user.");
    }

    // Get the user's GMB configuration
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            gmbAccountId: true,
            gmbLocationId: true,
            gmbAccountName: true,
            gmbLocationName: true
        }
    }) as any;

    if (!user?.gmbAccountId || !user?.gmbLocationId) {
        throw new Error("GMB account not configured. Please complete the setup process.");
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(account);

    return { 
        accessToken,
        accountId: account.providerAccountId,
        gmbAccountId: user.gmbAccountId,
        gmbLocationId: user.gmbLocationId,
        gmbAccountName: user.gmbAccountName,
        gmbLocationName: user.gmbLocationName
    };
}

/**
 * Sends an authenticated request to the Google My Business API and returns the parsed JSON response.
 *
 * Throws an error with status and code if the API response is not successful.
 *
 * @param url - The GMB API endpoint URL
 * @param options - Optional fetch request options
 * @returns The parsed JSON response from the GMB API
 */
async function makeGmbRequest(url: string, options: RequestInit = {}) {
    const { accessToken } = await getGmbAuth();
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        error.code = errorData.error?.code;
        throw error;
    }

    return response.json();
}

/**
 * Retrieves Google My Business reviews with caching and automatic retry on failure.
 *
 * Attempts to return cached reviews if available; otherwise, fetches reviews from the GMB API with retry logic and caches the result for 5 minutes. On error, returns an object with an error message and an empty reviews array.
 *
 * @returns An array of reviews, or an error object with an empty reviews array if retrieval fails.
 */
export async function getGmbReviews() {
    const cacheKey = 'gmb:reviews';
    
    try {
        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { gmbLocationId } = await getGmbAuth();
        
        const reviews = await retryWithBackoff(async () => {
            return await makeGmbRequest(`${GMB_API_BASE}/locations/${gmbLocationId}/reviews`);
        });

        // Cache for 5 minutes
        await cache.set(cacheKey, reviews, DEFAULT_CACHE_TTL);
        
        return reviews.reviews || [];

    } catch (error: any) {
        console.error('GMB Reviews Error:', error);
        return { 
            error: error.message,
            reviews: [],
            cached: false 
        };
    }
}

/**
 * Retrieves Google My Business location information, using cache when available.
 *
 * Attempts to fetch business info from cache; if not present, retrieves it from the GMB API with retry logic and caches the result for 10 minutes. Returns a structured error object with `businessInfo: null` if the operation fails.
 *
 * @returns The business information object, or an error object with `businessInfo: null` on failure.
 */
export async function getGmbBusinessInfo() {
    const cacheKey = 'gmb:business_info';
    
    try {
        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { gmbLocationId } = await getGmbAuth();
        
        const businessInfo = await retryWithBackoff(async () => {
            return await makeGmbRequest(`${GMB_API_BASE}/locations/${gmbLocationId}`);
        });

        // Cache for 10 minutes
        await cache.set(cacheKey, businessInfo, DEFAULT_CACHE_TTL * 2);
        
        return businessInfo;

    } catch (error: any) {
        console.error('GMB Business Info Error:', error);
        return { 
            error: error.message,
            businessInfo: null,
            cached: false 
        };
    }
}

/**
 * Sends a reply to a specified Google My Business review.
 *
 * Attempts to post a comment in reply to the given review. On success, invalidates the cached reviews to ensure fresh data. Returns the API response or an error object with `success: false` if the operation fails.
 *
 * @param reviewId - The unique identifier of the review to reply to
 * @param comment - The reply comment to post
 * @returns The API response object, or an error object with `success: false` if the reply fails
 */
export async function replyToReview(reviewId: string, comment: string) {
    try {
        const { gmbLocationId } = await getGmbAuth();
        
        const response = await retryWithBackoff(async () => {
            return await makeGmbRequest(
                `${GMB_API_BASE}/locations/${gmbLocationId}/reviews/${reviewId}/reply`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ comment }),
                }
            );
        });

        // Invalidate reviews cache after reply
        await cache.del('gmb:reviews');
        
        return response;

    } catch (error: any) {
        console.error('GMB Reply Error:', error);
        return { 
            error: error.message,
            success: false 
        };
    }
}

/**
 * Retrieves Google My Business insights and analytics for the specified date range.
 *
 * Attempts to return cached insights if available; otherwise, fetches insights from the GMB API with retry logic and caches the result for one hour.
 *
 * @param startDate - Optional start date for the insights data (YYYY-MM-DD)
 * @param endDate - Optional end date for the insights data (YYYY-MM-DD)
 * @returns Insights data from GMB, or an error object with `insights: null` if retrieval fails
 */
export async function getGmbInsights(startDate?: string, endDate?: string) {
    const cacheKey = `gmb:insights:${startDate}:${endDate}`;
    
    try {
        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { gmbLocationId } = await getGmbAuth();
        
        const insights = await retryWithBackoff(async () => {
            const params = new URLSearchParams();
            if (startDate) params.set('start_date', startDate);
            if (endDate) params.set('end_date', endDate);
            
            return await makeGmbRequest(
                `${GMB_API_BASE}/locations/${gmbLocationId}/insights?${params}`
            );
        });

        // Cache for 1 hour
        await cache.set(cacheKey, insights, DEFAULT_CACHE_TTL * 12);
        
        return insights;

    } catch (error: any) {
        console.error('GMB Insights Error:', error);
        return { 
            error: error.message,
            insights: null,
            cached: false 
        };
    }
}

/**
 * Retrieves photos for the Google My Business location, using cache when available.
 *
 * Attempts to fetch cached photos; if unavailable, retrieves media items from the GMB API with retry logic and caches the result for 30 minutes. Returns an array of media items, or an error object with an empty array if retrieval fails.
 */
export async function getGmbPhotos() {
    const cacheKey = 'gmb:photos';
    
    try {
        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { gmbLocationId } = await getGmbAuth();
        
        const photos = await retryWithBackoff(async () => {
            return await makeGmbRequest(`${GMB_API_BASE}/locations/${gmbLocationId}/media`);
        });

        // Cache for 30 minutes
        await cache.set(cacheKey, photos, DEFAULT_CACHE_TTL * 6);
        
        return photos.mediaItems || [];

    } catch (error: any) {
        console.error('GMB Photos Error:', error);
        return { 
            error: error.message,
            photos: [],
            cached: false 
        };
    }
}

/**
 * Performs a health check on the Google My Business integration.
 *
 * Attempts authentication and a basic API request to verify connectivity and token validity.
 * Returns a status object indicating whether the service is healthy, along with account and location names if successful, or an error message if not.
 *
 * @returns An object containing the health status, account and location names (if healthy), or an error message (if unhealthy), and a timestamp.
 */
export async function checkGmbHealth() {
    try {
        const authData = await getGmbAuth();
        
        // Simple test request
        await makeGmbRequest(`${GMB_API_BASE}/locations/${authData.gmbLocationId}`);
        
        return {
            status: 'healthy',
            account: authData.gmbAccountName,
            location: authData.gmbLocationName,
            timestamp: new Date().toISOString()
        };
    } catch (error: any) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
