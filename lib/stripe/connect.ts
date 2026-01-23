import { stripe } from './config';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface CreateConnectAccountParams {
  therapistId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function createConnectAccount(
  params: CreateConnectAccountParams
): Promise<{ accountId: string; onboardingUrl: string } | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  try {
    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      email: params.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
      },
      metadata: {
        therapistId: params.therapistId,
      },
    });

    // Create an account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${APP_URL}/therapist/earnings?stripe_refresh=true`,
      return_url: `${APP_URL}/therapist/earnings?stripe_success=true`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw error;
  }
}

export async function createConnectLoginLink(accountId: string): Promise<string | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  } catch (error) {
    console.error('Error creating login link:', error);
    throw error;
  }
}

export async function getConnectAccount(accountId: string) {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.accounts.retrieve(accountId);
  } catch (error) {
    console.error('Error retrieving account:', error);
    return null;
  }
}

export async function createRefreshLink(accountId: string): Promise<string | null> {
  if (!stripe) {
    return null;
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/therapist/earnings?stripe_refresh=true`,
      return_url: `${APP_URL}/therapist/earnings?stripe_success=true`,
      type: 'account_onboarding',
    });
    return accountLink.url;
  } catch (error) {
    console.error('Error creating refresh link:', error);
    throw error;
  }
}
