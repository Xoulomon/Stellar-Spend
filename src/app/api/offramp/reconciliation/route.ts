import { NextResponse, type NextRequest } from 'next/server';
import {
  generateReconciliationReport,
  type ReconciliationRecord,
} from '@/lib/reconciliation';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'records array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate record structure
    for (const record of records) {
      if (!record.transactionId) {
        return NextResponse.json(
          { error: 'Each record must have a transactionId' },
          { status: 400 }
        );
      }
    }

    const report = await generateReconciliationReport(records as ReconciliationRecord[]);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Reconciliation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate reconciliation report',
      },
      { status: 500 }
    );
  }
}
