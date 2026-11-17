import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// 1,000+ Stripe PaymentIntents, matching the call Orbit makes in
// PaymentsService.createPaymentIntent: USD, manual capture, unconfirmed.
// This hits Stripe's API directly. It does not call POST /payments/intent,
// which would reserve a listing and write a transaction row.
//
// Test mode only. Live keys (sk_live_) are refused.
//   k6 run -e STRIPE_SECRET_KEY=sk_test_... load-tests/stripe-transactions.k6.js
//
// ITERATIONS defaults to 1000. Raise it to go past that.
// The run leaves uncaptured test-mode PaymentIntents on the Stripe account.

const responsesByStatus = new Counter('responses_by_status');
const stripeTransactionsOk = new Counter('stripe_transactions_ok');

function iterationCount() {
  const parsed = __ENV.ITERATIONS ? Number(__ENV.ITERATIONS) : 1000;
  if (!Number.isInteger(parsed) || parsed < 1000) {
    throw new Error('ITERATIONS must be an integer of at least 1000');
  }
  return parsed;
}

const iterations = iterationCount();

export const options = {
  scenarios: {
    stripe_payment_intents: {
      executor: 'shared-iterations',
      vus: Number(__ENV.VUS || 5),
      iterations,
      maxDuration: __ENV.MAX_DURATION || '20m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:payment_intent}': ['p(95)<2500'],
    stripe_transactions_ok: [`count>=${iterations}`],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  const key = __ENV.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_test_')) {
    throw new Error(
      'Set STRIPE_SECRET_KEY to a Stripe test key (sk_test_...). Live keys are refused.',
    );
  }
}

export default function () {
  const body = [
    'amount=500',
    'currency=usd',
    'capture_method=manual',
    'metadata[source]=orbit-k6',
  ].join('&');

  const res = http.post('https://api.stripe.com/v1/payment_intents', body, {
    headers: {
      Authorization: `Bearer ${__ENV.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    tags: { endpoint: 'payment_intent' },
  });

  responsesByStatus.add(1, { status: String(res.status) });

  const ok = check(res, {
    'payment intent created': (r) =>
      r.status === 200 && String(r.body).includes('"object": "payment_intent"'),
  });
  if (ok) stripeTransactionsOk.add(1);

  sleep(Number(__ENV.SLEEP_SECONDS || 0.2));
}
