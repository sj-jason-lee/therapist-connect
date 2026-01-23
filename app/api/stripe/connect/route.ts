import { NextRequest, NextResponse } from 'next/server';
import { createConnectAccount, createConnectLoginLink, createRefreshLink, getConnectAccount } from '@/lib/stripe/connect';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        const { therapistId, email, firstName, lastName } = data;
        if (!therapistId || !email || !firstName || !lastName) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const result = await createConnectAccount({
          therapistId,
          email,
          firstName,
          lastName,
        });

        if (!result) {
          return NextResponse.json(
            { error: 'Failed to create Connect account' },
            { status: 500 }
          );
        }

        return NextResponse.json(result);
      }

      case 'login': {
        const { accountId } = data;
        if (!accountId) {
          return NextResponse.json(
            { error: 'Missing account ID' },
            { status: 400 }
          );
        }

        const url = await createConnectLoginLink(accountId);
        if (!url) {
          return NextResponse.json(
            { error: 'Failed to create login link' },
            { status: 500 }
          );
        }

        return NextResponse.json({ url });
      }

      case 'refresh': {
        const { accountId } = data;
        if (!accountId) {
          return NextResponse.json(
            { error: 'Missing account ID' },
            { status: 400 }
          );
        }

        const url = await createRefreshLink(accountId);
        if (!url) {
          return NextResponse.json(
            { error: 'Failed to create refresh link' },
            { status: 500 }
          );
        }

        return NextResponse.json({ url });
      }

      case 'status': {
        const { accountId } = data;
        if (!accountId) {
          return NextResponse.json(
            { error: 'Missing account ID' },
            { status: 400 }
          );
        }

        const account = await getConnectAccount(accountId);
        if (!account) {
          return NextResponse.json(
            { error: 'Account not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Stripe Connect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
