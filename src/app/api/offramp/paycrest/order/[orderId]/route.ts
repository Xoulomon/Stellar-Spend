import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const maxDuration = 10;

interface PaycrestHttpError extends Error {
  status: number;
}

class PaycrestAdapter {
  private apiKey: string;
  private apiUrl = 'https://api.paycrest.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getOrderStatus(orderId: string) {
    const response = await fetch(`${this.apiUrl}/sender/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': this.apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data?.message ?? 'Failed to fetch order status') as PaycrestHttpError;
      error.status = response.status;
      throw error;
    }

    return data;
  }
}

/**
 * GET /api/offramp/paycrest/order/[orderId]
 * 
 * Fetches the status of a Paycrest payout order.
 * 
 * Path parameters:
 * - orderId: string (required)
 * 
 * Response:
 * {
 *   data: {
 *     status: string
 *     id: string
 *     ...
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Instantiate PaycrestAdapter
    const paycrest = new PaycrestAdapter(env.server.PAYCREST_API_KEY);

    // Get order status
    const order = await paycrest.getOrderStatus(orderId);

    return NextResponse.json({
      data: {
        status: order.status,
        id: order.id,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching Paycrest order status:', err);

    if (err instanceof Error && 'status' in err) {
      const httpError = err as PaycrestHttpError;
      if (httpError.status === 404) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: err.message },
        { status: httpError.status }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
