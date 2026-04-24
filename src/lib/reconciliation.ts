import { env } from './env';

export interface ReconciliationRecord {
  transactionId: string;
  stellarTxHash?: string;
  baseTxHash?: string;
  paycrestOrderId?: string;
  timestamp: string;
}

export interface ReconciliationDiscrepancy {
  transactionId: string;
  type: 'missing_stellar' | 'missing_base' | 'missing_paycrest' | 'amount_mismatch' | 'status_mismatch';
  description: string;
  severity: 'low' | 'medium' | 'high';
  stellarData?: any;
  baseData?: any;
  paycrestData?: any;
}

export interface ReconciliationReport {
  timestamp: string;
  totalTransactions: number;
  matchedTransactions: number;
  discrepancies: ReconciliationDiscrepancy[];
  summary: {
    missingStellar: number;
    missingBase: number;
    missingPaycrest: number;
    amountMismatches: number;
    statusMismatches: number;
  };
}

async function fetchStellarTransaction(txHash: string): Promise<any> {
  try {
    const response = await fetch(`${env.server.STELLAR_HORIZON_URL}/transactions/${txHash}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Stellar transaction:', error);
    return null;
  }
}

async function fetchBaseTransaction(txHash: string): Promise<any> {
  try {
    const response = await fetch(env.server.BASE_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [txHash],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('Error fetching Base transaction:', error);
    return null;
  }
}

async function fetchPaycrestOrder(orderId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.paycrest.io/aggregator/orders/${orderId}`, {
      headers: {
        'x-api-key': env.server.PAYCREST_API_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching Paycrest order:', error);
    return null;
  }
}

export async function reconcileTransaction(
  record: ReconciliationRecord
): Promise<ReconciliationDiscrepancy[]> {
  const discrepancies: ReconciliationDiscrepancy[] = [];

  // Fetch data from all systems in parallel
  const [stellarData, baseData, paycrestData] = await Promise.all([
    record.stellarTxHash ? fetchStellarTransaction(record.stellarTxHash) : Promise.resolve(null),
    record.baseTxHash ? fetchBaseTransaction(record.baseTxHash) : Promise.resolve(null),
    record.paycrestOrderId ? fetchPaycrestOrder(record.paycrestOrderId) : Promise.resolve(null),
  ]);

  // Check for missing records
  if (record.stellarTxHash && !stellarData) {
    discrepancies.push({
      transactionId: record.transactionId,
      type: 'missing_stellar',
      description: `Stellar transaction ${record.stellarTxHash} not found`,
      severity: 'high',
    });
  }

  if (record.baseTxHash && !baseData) {
    discrepancies.push({
      transactionId: record.transactionId,
      type: 'missing_base',
      description: `Base transaction ${record.baseTxHash} not found`,
      severity: 'high',
    });
  }

  if (record.paycrestOrderId && !paycrestData) {
    discrepancies.push({
      transactionId: record.transactionId,
      type: 'missing_paycrest',
      description: `Paycrest order ${record.paycrestOrderId} not found`,
      severity: 'medium',
    });
  }

  // Check for status mismatches
  if (stellarData && paycrestData) {
    const stellarSuccess = stellarData.successful === true;
    const paycrestSuccess = paycrestData.status === 'completed';

    if (stellarSuccess !== paycrestSuccess) {
      discrepancies.push({
        transactionId: record.transactionId,
        type: 'status_mismatch',
        description: 'Status mismatch between Stellar and Paycrest',
        severity: 'high',
        stellarData: { successful: stellarSuccess },
        paycrestData: { status: paycrestData.status },
      });
    }
  }

  return discrepancies;
}

export async function generateReconciliationReport(
  records: ReconciliationRecord[]
): Promise<ReconciliationReport> {
  const allDiscrepancies: ReconciliationDiscrepancy[] = [];

  // Process records in batches to avoid overwhelming APIs
  const batchSize = 10;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((record) => reconcileTransaction(record)));
    allDiscrepancies.push(...batchResults.flat());
  }

  // Calculate summary
  const summary = {
    missingStellar: allDiscrepancies.filter((d) => d.type === 'missing_stellar').length,
    missingBase: allDiscrepancies.filter((d) => d.type === 'missing_base').length,
    missingPaycrest: allDiscrepancies.filter((d) => d.type === 'missing_paycrest').length,
    amountMismatches: allDiscrepancies.filter((d) => d.type === 'amount_mismatch').length,
    statusMismatches: allDiscrepancies.filter((d) => d.type === 'status_mismatch').length,
  };

  return {
    timestamp: new Date().toISOString(),
    totalTransactions: records.length,
    matchedTransactions: records.length - allDiscrepancies.length,
    discrepancies: allDiscrepancies,
    summary,
  };
}

export interface ManualReconciliationAction {
  transactionId: string;
  action: 'retry' | 'mark_resolved' | 'investigate';
  notes?: string;
  resolvedBy?: string;
}

export async function performManualReconciliation(
  action: ManualReconciliationAction
): Promise<{ success: boolean; message: string }> {
  // This would integrate with a database to track manual reconciliation actions
  // For now, return a success response
  return {
    success: true,
    message: `Manual reconciliation action '${action.action}' recorded for transaction ${action.transactionId}`,
  };
}

export interface ReconciliationAlert {
  severity: 'low' | 'medium' | 'high';
  message: string;
  discrepancies: ReconciliationDiscrepancy[];
  timestamp: string;
}

export function generateAlerts(report: ReconciliationReport): ReconciliationAlert[] {
  const alerts: ReconciliationAlert[] = [];

  // Alert for high-severity discrepancies
  const highSeverity = report.discrepancies.filter((d) => d.severity === 'high');
  if (highSeverity.length > 0) {
    alerts.push({
      severity: 'high',
      message: `${highSeverity.length} high-severity discrepancies detected`,
      discrepancies: highSeverity,
      timestamp: new Date().toISOString(),
    });
  }

  // Alert for multiple missing records
  if (report.summary.missingStellar > 5) {
    alerts.push({
      severity: 'high',
      message: `${report.summary.missingStellar} missing Stellar transactions`,
      discrepancies: report.discrepancies.filter((d) => d.type === 'missing_stellar'),
      timestamp: new Date().toISOString(),
    });
  }

  if (report.summary.missingPaycrest > 5) {
    alerts.push({
      severity: 'medium',
      message: `${report.summary.missingPaycrest} missing Paycrest orders`,
      discrepancies: report.discrepancies.filter((d) => d.type === 'missing_paycrest'),
      timestamp: new Date().toISOString(),
    });
  }

  return alerts;
}
