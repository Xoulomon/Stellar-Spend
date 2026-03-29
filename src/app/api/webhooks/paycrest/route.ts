import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import type { PayoutStatus } from '@/lib/offramp/types';

export const maxDuration = 10;

function mapPaycrestStatus(eventType: string): PayoutStatus | null {
  switch (eventType) {
    case 'payment_order.pending':      return 'pending';
    case 'payment_order.validated':    return 'validated';
    case 'payment_order.settled':      return 'settled';
    case 'payment_order.refunded':     return 'refunded';
    case 'payment_order.expired':      return 'expired';
    default:                           return null;
  }
}

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Buffer.from(mac).toString('hex');
  // Timing-safe comparison via fixed-length XOR
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('X-Paycrest-Signature') ?? '';

  const valid = await verifySignature(rawBody, signature, env.server.PAYCREST_WEBHOOK_SECRET);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;
    const payoutOrderId: string = data?.id ?? data?.orderId ?? '';
    const status = mapPaycrestStatus(event);

    if (status && payoutOrderId) {
      console.log(`Order ${payoutOrderId} status → ${status}`);
    } else {
      console.warn(`Paycrest webhook: unhandled event "${event}" for order "${payoutOrderId}"`);
    }
  } catch {
    console.warn('Paycrest webhook: failed to parse payload');
  }

  return NextResponse.json({ received: true });
}
