import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createPaymentIntent } from '@/lib/stripe/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create-session': {
        const {
          bookingId,
          shiftId,
          organizerId,
          therapistId,
          therapistStripeAccountId,
          baseAmountCents,
          shiftTitle,
          shiftDate,
          hours,
        } = data;

        if (!bookingId || !shiftId || !organizerId || !therapistId || !therapistStripeAccountId || !baseAmountCents) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const result = await createCheckoutSession({
          bookingId,
          shiftId,
          organizerId,
          therapistId,
          therapistStripeAccountId,
          baseAmountCents,
          shiftTitle: shiftTitle || 'Athletic Therapy Coverage',
          shiftDate: shiftDate || 'TBD',
          hours: hours || 1,
        });

        if (!result) {
          return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
          );
        }

        return NextResponse.json(result);
      }

      case 'create-intent': {
        const {
          bookingId,
          shiftId,
          organizerId,
          therapistId,
          therapistStripeAccountId,
          baseAmountCents,
          description,
        } = data;

        if (!bookingId || !shiftId || !organizerId || !therapistId || !therapistStripeAccountId || !baseAmountCents) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const result = await createPaymentIntent({
          bookingId,
          shiftId,
          organizerId,
          therapistId,
          therapistStripeAccountId,
          baseAmountCents,
          description: description || 'Athletic Therapy Coverage',
        });

        if (!result) {
          return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
          );
        }

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Stripe Checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
