import { ExtractionModel, SUPPORTED_EXTRACTION_MODELS } from './claude-invoice-model';

export const EXTRACTION_CONFIG = Symbol('EXTRACTION_CONFIG');

export interface ExtractionConfig {
  /** Kill switch (G25); read at startup, so changing it needs an app restart. */
  enabled: boolean;
  /** User IDs allowed during rollout; empty means every account (G25). */
  accountAllowlist: string[];
  /** Hard monthly cap on AI spend, shared with analytics (A4, H2). */
  monthlyBudgetUsd: number;
  /** Claude model for extraction (A2); Haiku 5.5 is the comparison candidate. */
  model: ExtractionModel;
}

const DEFAULT_MONTHLY_BUDGET_USD = 2;

export function extractionConfigFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ExtractionConfig {
  const enabled = (environment.EXTRACTION_ENABLED ?? '').trim().toLowerCase();
  if (!['', 'true', 'false'].includes(enabled)) {
    throw new Error('EXTRACTION_ENABLED must be true or false');
  }

  const budget = (environment.EXTRACTION_MONTHLY_BUDGET_USD ?? '').trim();
  const monthlyBudgetUsd = budget ? Number(budget) : DEFAULT_MONTHLY_BUDGET_USD;
  if (!Number.isFinite(monthlyBudgetUsd) || monthlyBudgetUsd < 0) {
    throw new Error('EXTRACTION_MONTHLY_BUDGET_USD must be a non-negative number');
  }

  const model = (environment.EXTRACTION_MODEL ?? '').trim() || 'claude-sonnet-5-5';
  if (!(SUPPORTED_EXTRACTION_MODELS as readonly string[]).includes(model)) {
    throw new Error(`EXTRACTION_MODEL must be one of ${SUPPORTED_EXTRACTION_MODELS.join(', ')}`);
  }

  return {
    enabled: enabled === 'true',
    accountAllowlist: (environment.EXTRACTION_ACCOUNT_ALLOWLIST ?? '')
      .split(',').map(id => id.trim()).filter(Boolean),
    monthlyBudgetUsd,
    model: model as ExtractionModel,
  };
}
