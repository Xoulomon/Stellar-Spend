import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

interface PaycrestOrderRequest {
  amount: number;
  rate: number;
  token: string;
  network: string;
  reference: string;
  returnAddress: string;
  recipient: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    currency: string;
  };
}

interface PaycrestHttpError extends Error {
  status: number;
}

class PaycrestAdapter {
  private apiKey: string;
  private apiUrl = 'https://api.paycrest.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createOrder(payload: PaycrestOrderRequest) {
    const response = await fetch(`${this.apiUrl}/sender/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data?.message ?? 'Failed to create Paycrest order') as PaycrestHttpError;
      error.status = response.status;
      throw error;
    }

    return data;
  }
}

/**
 * POST /api/offramp/paycrest/order
 * 
 * Creates a Paycrest payout order.
 * 
 * Request body:
 * {
 *   amount: number (required, > 0)
 *   rate: number (required, > 0)
 *   token: string (required, e.g., 'USDC')
 *   network: string (required, e.g., 'stellar')
 *   reference: string (required)
 *   returnAddress: string (required)
 *   recipient: {
 *     institution: string (required)
 *     accountIdentifier: string (required)
 *     accountName: string (required)
 *     currency: string (required)
 *   }
 * }
 * 
 * Response:
 * {
 *   data: {
 *     id: string
 *     receiveAddress: string
 *     ...
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, rate, token, network, reference, returnAddress, recipient } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (amount === undefined || amount === null) {
      errors.amount = 'amount is required';
    } else if (typeof amount !== 'number' || amount <= 0) {
      errors.amount = 'amount must be a positive number';
    }

    if (rate === undefined || rate === null) {
      errors.rate = 'rate is required';
    } else if (typeof rate !== 'number' || rate <= 0) {
      errors.rate = 'rate must be a positive number';
    }

    if (!token || typeof token !== 'string') {
      errors.token = 'token is required and must be a string';
    }

    if (!network || typeof network !== 'string') {
      errors.network = 'network is required and must be a string';
    }

    if (!reference || typeof reference !== 'string') {
      errors.reference = 'reference is required and must be a string';
    }

    if (!returnAddress || typeof returnAddress !== 'string') {
      errors.returnAddress = 'returnAddress is required and must be a string';
    }

    if (!recipient || typeof recipient !== 'object') {
      errors.recipient = 'recipient is required and must be an object';
    } else {
      const { institution, accountIdentifier, accountName, currency } = recipient;

      if (!institution || typeof institution !== 'string') {
        errors['recipient.institution'] = 'recipient.institution is required and must be a string';
      }

      if (!accountIdentifier || typeof accountIdentifier !== 'string') {
        errors['recipient.accountIdentifier'] = 'recipient.accountIdentifier is required and must be a string';
      }

      if (!accountName || typeof accountName !== 'string') {
        errors['recipient.accountName'] = 'recipient.accountName is required and must be a string';
      }

      if (!currency || typeof currency !== 'string') {
        errors['recipient.currency'] = 'recipient.currency is required and must be a string';
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Instantiate PaycrestAdapter
    const paycrest = new PaycrestAdapter(env.server.PAYCREST_API_KEY);

    // Create order
    const order = await paycrest.createOrder({
      amount,
      rate,
      token,
      network,
      reference,
      returnAddress,
      recipient,
    });

    return NextResponse.json({ data: order });
  } catch (err: unknown) {
    console.error('Error creating Paycrest order:', err);

    if (err instanceof Error && 'status' in err) {
      const httpError = err as PaycrestHttpError;
      return NextResponse.json(
        { error: err.message },
        { status: httpError.status }
      );
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
