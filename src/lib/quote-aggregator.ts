import { fetchPaycrestQuote, buildQuote, type QuoteResult } from './offramp/utils/quote-fetcher';

export interface ProviderQuote extends QuoteResult {
  provider: string;
  success: boolean;
  error?: string;
  responseTime?: number;
}

export interface AggregatedQuoteResponse {
  bestQuote: ProviderQuote | null;
  allQuotes: ProviderQuote[];
  timestamp: string;
}

export type QuoteProvider = 'paycrest' | 'allbridge';

interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  timeout: number;
}

const PROVIDER_CONFIGS: Record<QuoteProvider, ProviderConfig> = {
  paycrest: {
    name: 'Paycrest',
    enabled: true,
    priority: 1,
    timeout: 5000,
  },
  allbridge: {
    name: 'Allbridge',
    enabled: false, // Not yet implemented
    priority: 2,
    timeout: 5000,
  },
};

async function fetchQuoteFromPaycrest(
  receiveAmount: string,
  currency: string
): Promise<ProviderQuote> {
  const start = Date.now();
  try {
    const { rate, destinationAmount } = await fetchPaycrestQuote(receiveAmount, currency);
    const quote = buildQuote(destinationAmount, rate, currency, '0', '0', 300);

    return {
      ...quote,
      provider: 'paycrest',
      success: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      destinationAmount: '0',
      rate: 0,
      currency,
      bridgeFee: '0',
      payoutFee: '0',
      estimatedTime: 0,
      provider: 'paycrest',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start,
    };
  }
}

async function fetchQuoteFromAllbridge(
  receiveAmount: string,
  currency: string
): Promise<ProviderQuote> {
  // Placeholder for future Allbridge integration
  return {
    destinationAmount: '0',
    rate: 0,
    currency,
    bridgeFee: '0',
    payoutFee: '0',
    estimatedTime: 0,
    provider: 'allbridge',
    success: false,
    error: 'Provider not yet implemented',
    responseTime: 0,
  };
}

function rankQuotes(quotes: ProviderQuote[]): ProviderQuote[] {
  const successfulQuotes = quotes.filter((q) => q.success);

  if (successfulQuotes.length === 0) {
    return quotes;
  }

  // Rank by destination amount (higher is better)
  return successfulQuotes.sort((a, b) => {
    const amountA = parseFloat(a.destinationAmount);
    const amountB = parseFloat(b.destinationAmount);

    if (amountB !== amountA) {
      return amountB - amountA;
    }

    // If amounts are equal, prefer faster response time
    return (a.responseTime || 0) - (b.responseTime || 0);
  });
}

function selectBestQuote(quotes: ProviderQuote[]): ProviderQuote | null {
  const rankedQuotes = rankQuotes(quotes);

  if (rankedQuotes.length === 0) {
    return null;
  }

  return rankedQuotes[0];
}

export async function aggregateQuotes(
  receiveAmount: string,
  currency: string,
  providers: QuoteProvider[] = ['paycrest']
): Promise<AggregatedQuoteResponse> {
  const enabledProviders = providers.filter((p) => PROVIDER_CONFIGS[p].enabled);

  if (enabledProviders.length === 0) {
    throw new Error('No enabled providers available');
  }

  // Fetch quotes in parallel from all enabled providers
  const quotePromises = enabledProviders.map(async (provider) => {
    const config = PROVIDER_CONFIGS[provider];

    try {
      const timeoutPromise = new Promise<ProviderQuote>((_, reject) =>
        setTimeout(() => reject(new Error('Provider timeout')), config.timeout)
      );

      let fetchPromise: Promise<ProviderQuote>;
      if (provider === 'paycrest') {
        fetchPromise = fetchQuoteFromPaycrest(receiveAmount, currency);
      } else if (provider === 'allbridge') {
        fetchPromise = fetchQuoteFromAllbridge(receiveAmount, currency);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      return {
        destinationAmount: '0',
        rate: 0,
        currency,
        bridgeFee: '0',
        payoutFee: '0',
        estimatedTime: 0,
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Provider failed',
        responseTime: config.timeout,
      };
    }
  });

  const allQuotes = await Promise.all(quotePromises);
  const bestQuote = selectBestQuote(allQuotes);

  return {
    bestQuote,
    allQuotes,
    timestamp: new Date().toISOString(),
  };
}

export function getProviderStatus(): Record<QuoteProvider, ProviderConfig> {
  return PROVIDER_CONFIGS;
}
