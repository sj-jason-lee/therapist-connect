import { stripe, calculatePlatformFee, calculateTherapistPayout, calculateTotalWithFee } from './config';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface CreatePaymentIntentParams {
  bookingId: string;
  shiftId: string;
  organizerId: string;
  therapistId: string;
  therapistStripeAccountId: string;
  baseAmountCents: number; // Base amount (therapist's pay) in cents
  description: string;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  const platformFee = calculatePlatformFee(params.baseAmountCents);
  const totalAmount = calculateTotalWithFee(params.baseAmountCents);
  const therapistPayout = calculateTherapistPayout(params.baseAmountCents);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Organizer pays base + platform fee
      currency: 'cad',
      description: params.description,
      transfer_data: {
        destination: params.therapistStripeAccountId,
      },
      application_fee_amount: platformFee, // Platform keeps the fee
      metadata: {
        bookingId: params.bookingId,
        shiftId: params.shiftId,
        organizerId: params.organizerId,
        therapistId: params.therapistId,
        platformFee: platformFee.toString(),
        therapistPayout: therapistPayout.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export interface CreateCheckoutSessionParams {
  bookingId: string;
  shiftId: string;
  organizerId: string;
  therapistId: string;
  therapistStripeAccountId: string;
  baseAmountCents: number; // Base amount (therapist's pay) in cents
  shiftTitle: string;
  shiftDate: string;
  hours: number;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  const platformFee = calculatePlatformFee(params.baseAmountCents);
  const totalAmount = calculateTotalWithFee(params.baseAmountCents);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: params.shiftTitle,
              description: `${params.shiftDate} - ${params.hours} hours of athletic therapy coverage`,
            },
            unit_amount: params.baseAmountCents, // Show base rate
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Service Fee',
              description: 'Platform service fee (20%)',
            },
            unit_amount: platformFee,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: {
          destination: params.therapistStripeAccountId,
        },
        application_fee_amount: platformFee, // Platform keeps this
        metadata: {
          bookingId: params.bookingId,
          shiftId: params.shiftId,
          organizerId: params.organizerId,
          therapistId: params.therapistId,
          baseAmount: params.baseAmountCents.toString(),
          platformFee: platformFee.toString(),
          totalAmount: totalAmount.toString(),
        },
      },
      success_url: `${APP_URL}/organizer/bookings?payment_success=true&booking=${params.bookingId}`,
      cancel_url: `${APP_URL}/organizer/bookings?payment_cancelled=true&booking=${params.bookingId}`,
      metadata: {
        bookingId: params.bookingId,
        shiftId: params.shiftId,
        organizerId: params.organizerId,
        therapistId: params.therapistId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export interface CreateCustomerParams {
  organizerId: string;
  email: string;
  name: string;
  organizationName?: string;
}

export async function createOrRetrieveCustomer(
  params: CreateCustomerParams
): Promise<string | null> {
  if (!stripe) {
    return null;
  }

  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: params.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.organizationName || params.name,
      metadata: {
        organizerId: params.organizerId,
      },
    });

    return customer.id;
  } catch (error) {
    console.error('Error with customer:', error);
    throw error;
  }
}

export async function getPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return null;
  }
}
