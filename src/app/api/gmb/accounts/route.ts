// src/app/api/gmb/accounts/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Lists available GMB accounts for the authenticated user
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get the user's Google access token
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'google',
            }
        });

        if (!account?.access_token) {
            return NextResponse.json({ error: 'Google account not connected' }, { status: 400 });
        }

        // Fetch GMB accounts from Google
        const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: {
                Authorization: `Bearer ${account.access_token}`,
            },
        });

        if (!accountsResponse.ok) {
            const error = await accountsResponse.json();
            console.error('GMB Accounts API Error:', error);
            return NextResponse.json({ error: 'Failed to fetch GMB accounts' }, { status: 500 });
        }

        const accountsData = await accountsResponse.json();
        const accounts = accountsData.accounts || [];

        // For each account, get locations
        const accountsWithLocations = await Promise.all(
            accounts.map(async (account: any) => {
                const locationsResponse = await fetch(
                    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
                    {
                        headers: {
                            Authorization: `Bearer ${account.access_token}`,
                        },
                    }
                );

                if (locationsResponse.ok) {
                    const locationsData = await locationsResponse.json();
                    return {
                        ...account,
                        locations: locationsData.locations || []
                    };
                }

                return {
                    ...account,
                    locations: []
                };
            })
        );

        return NextResponse.json({ accounts: accountsWithLocations });
    } catch (error) {
        console.error('GMB Accounts Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Updates the user's selected GMB account and location
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { gmbAccountId, gmbLocationId, gmbAccountName, gmbLocationName } = await request.json();

        // Update user's GMB configuration
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                gmbAccountId,
                gmbLocationId,
                gmbAccountName,
                gmbLocationName
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update GMB Config Error:', error);
        return NextResponse.json({ error: 'Failed to update GMB configuration' }, { status: 500 });
    }
}
