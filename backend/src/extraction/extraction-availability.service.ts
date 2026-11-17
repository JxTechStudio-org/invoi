import { Inject, Injectable, Optional } from '@nestjs/common';
import { EXTRACTION_CONFIG, ExtractionConfig } from './extraction.config';
import { ExtractionJobsService } from './extraction-jobs.service';
import { INVOICE_EXTRACTOR, InvoiceExtractor } from './invoice-extractor';

/** Why the worker would not run a new job for this account right now. */
export type ExtractionUnavailableReason = 'disabled' | 'demo_account' | 'not_allowed' | 'budget_reached';

export interface ExtractionAccount {
  id: string;
  isDemo: boolean;
}

/**
 * The same gates the worker applies before claiming a job (kill switch, demo accounts,
 * allow-list, monthly budget), asked up front so a user request is refused instead of
 * leaving a job queued with no explanation.
 */
@Injectable()
export class ExtractionAvailabilityService {
  constructor(
    @Inject(EXTRACTION_CONFIG) private readonly config: ExtractionConfig,
    private readonly jobs: ExtractionJobsService,
    @Optional() @Inject(INVOICE_EXTRACTOR) private readonly extractor: InvoiceExtractor | null,
  ) {}

  /** Account-level gates only; no database query. */
  accountReason(account: ExtractionAccount): ExtractionUnavailableReason | null {
    if (!this.config.enabled || !this.extractor) return 'disabled';
    if (account.isDemo) return 'demo_account';
    const allowlist = this.config.accountAllowlist;
    if (allowlist.length && !allowlist.includes(account.id)) return 'not_allowed';
    return null;
  }

  async unavailableReason(account: ExtractionAccount): Promise<ExtractionUnavailableReason | null> {
    const reason = this.accountReason(account);
    if (reason) return reason;
    return await this.jobs.monthSpendUsd() >= this.config.monthlyBudgetUsd ? 'budget_reached' : null;
  }
}
