import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Payment functionality will be disabled.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

export const PLATFORM_FEE_PERCENT = 20; // 20% platform fee added on top

// Calculate platform fee based on the therapist's base amount
export function calculatePlatformFee(baseAmount: number): number {
  return Math.round(baseAmount * (PLATFORM_FEE_PERCENT / 100));
}

// Therapist gets 100% of the base amount
export function calculateTherapistPayout(baseAmount: number): number {
  return baseAmount;
}

// Total amount organizer pays = base amount + platform fee
export function calculateTotalWithFee(baseAmount: number): number {
  return baseAmount + calculatePlatformFee(baseAmount);
}
