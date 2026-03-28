import { NextResponse } from 'next/server';

export const maxDuration = 10;

// import { PAYCREST_WEBHOOK_SECRET } from '@/lib/env';

// TODO: handle Paycrest webhook events
export async function POST() {
  // Example of using the centralized env config
  // const webhookSecret = PAYCREST_WEBHOOK_SECRET;

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
