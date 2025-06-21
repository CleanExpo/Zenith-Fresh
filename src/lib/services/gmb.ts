// src/lib/services/gmb.ts

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * A helper function to get the current user's session and GMB access token.
 * This will be used by all other service methods.
 */
async function getGmbAuth() {
    const session = await auth();
    if (!session?.user?.id || !(session as any).accessToken) {
        throw new Error("Not authenticated or missing access token");
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            provider: 'google',
        }
    });

    if (!account) {
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

    return { 
        accessToken: account.access_token, 
        accountId: account.providerAccountId,
        gmbAccountId: user.gmbAccountId,
        gmbLocationId: user.gmbLocationId
    };
}

/**
 * Fetches a list of reviews for the client's GMB account.
 */
export async function getGmbReviews() {
    try {
        const { accessToken, gmbAccountId, gmbLocationId } = await getGmbAuth();

        const response = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${gmbAccountId}/locations/${gmbLocationId}/reviews`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("GMB API Error:", errorData);
            throw new Error("Failed to fetch GMB reviews.");
        }

        const data = await response.json();
        return data.reviews || [];

    } catch (error: any) {
        console.error(error);
        // In a real app, you would handle this more gracefully.
        return { error: error.message };
    }
}

/**
 * Fetches business information from GMB
 */
export async function getGmbBusinessInfo() {
    try {
        const { accessToken, gmbAccountId, gmbLocationId } = await getGmbAuth();

        const response = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${gmbAccountId}/locations/${gmbLocationId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("GMB API Error:", errorData);
            throw new Error("Failed to fetch business info.");
        }

        const data = await response.json();
        return data;

    } catch (error: any) {
        console.error(error);
        return { error: error.message };
    }
}

/**
 * Posts a reply to a review
 */
export async function replyToReview(reviewId: string, comment: string) {
    try {
        const { accessToken, gmbAccountId, gmbLocationId } = await getGmbAuth();

        const response = await fetch(
            `https://mybusiness.googleapis.com/v4/accounts/${gmbAccountId}/locations/${gmbLocationId}/reviews/${reviewId}/reply`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ comment }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("GMB API Error:", errorData);
            throw new Error("Failed to reply to review.");
        }

        const data = await response.json();
        return data;

    } catch (error: any) {
        console.error(error);
        return { error: error.message };
    }
}
