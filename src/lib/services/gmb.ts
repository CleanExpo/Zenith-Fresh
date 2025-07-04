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
 * Enhanced retry mechanism with exponential backoff
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
 * Enhanced token refresh mechanism
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
 * Enhanced GMB authentication with token refresh and error handling
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
 * Enhanced API request with error handling and caching
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
 * Enhanced reviews fetching with caching and retry logic
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
 * Enhanced business info fetching with caching
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
 * Enhanced review reply with proper error handling
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
 * Get GMB insights and analytics
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
 * Get location photos
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
 * Health check for GMB service
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
