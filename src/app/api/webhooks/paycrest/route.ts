import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/lib/env';
import { ErrorHandler } from '@/lib/error-handler';
import { generateRequestId, createRequestLogger } from '@/lib/offramp/utils/logger';
import type { PayoutStatus } from '@/lib/offramp/types';

export const maxDuration = 10;

function mapPaycrestStatus(eventType: string): PayoutStatus | null {
  switch (eventType) {
    case 'payment_order.pending':   return 'pending';
    case 'payment_order.validated': return 'validated';
    case 'payment_order.settled':   return 'settled';
    case 'payment_order.refunded':  return 'refunded';
    case 'payment_order.expired':   return 'expired';
    default:                        return null;
  }
}

/**
 * Verify the X-Paycrest-Signature header using HMAC-SHA256.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 */
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');

  // timingSafeEqual requires equal-length Buffers
  const computedBuf = Buffer.from(computed);
  const signatureBuf = Buffer.from(signature);

  if (computedBuf.length !== signatureBuf.length) return false;

  return timingSafeEqual(computedBuf, signatureBuf);
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, 'POST', '/api/webhooks/paycrest');

  // Read raw body first — must happen before any JSON parsing
  const rawBody = await request.text();
  const signature = request.headers.get('X-Paycrest-Signature') ?? '';

  if (!verifySignature(rawBody, signature, env.server.PAYCREST_WEBHOOK_SECRET)) {
    logger.logError(401, 'Invalid webhook signature');
    return ErrorHandler.unauthorized('Invalid signature');
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.event ?? '';
    const orderId: string = payload?.data?.id ?? payload?.data?.orderId ?? '';
    const status = mapPaycrestStatus(eventType);

    console.log(JSON.stringify({ requestId, eventType, orderId, status }));

    logger.logSuccess(200);
    return NextResponse.json({ received: true });
  } catch {
    logger.logError(400, 'Failed to parse webhook payload');
    return ErrorHandler.validation('Malformed JSON payload');
  }
}
