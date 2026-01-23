import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Extract metadata
        const { bookingId, shiftId, organizerId, therapistId } = session.metadata || {};

        if (bookingId) {
          // TODO: Update booking status in Firestore
          // This would typically:
          // 1. Mark the booking as paid
          // 2. Store the payment intent ID
          // 3. Send confirmation emails
          console.log('Payment completed for booking:', bookingId);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);

        const { bookingId } = paymentIntent.metadata || {};
        if (bookingId) {
          // TODO: Update booking with payment confirmation
          console.log('Payment succeeded for booking:', bookingId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent failed:', paymentIntent.id);

        const { bookingId } = paymentIntent.metadata || {};
        if (bookingId) {
          // TODO: Handle payment failure
          // Notify organizer, potentially release the booking
          console.log('Payment failed for booking:', bookingId);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Connect account updated:', account.id);

        // TODO: Update therapist's Stripe status in Firestore
        // Check if charges_enabled and payouts_enabled
        if (account.charges_enabled && account.payouts_enabled) {
          console.log('Account fully onboarded:', account.id);
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('Transfer created:', transfer.id);
        // Therapist payout has been initiated
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout completed:', payout.id);
        // Money has been deposited to therapist's bank account
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
