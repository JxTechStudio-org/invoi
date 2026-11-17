import { ExtractionConfig } from '../src/extraction/extraction.config';
import { ExtractionAvailabilityService } from '../src/extraction/extraction-availability.service';
import { ExtractionJobsService } from '../src/extraction/extraction-jobs.service';
import { InvoiceExtractor } from '../src/extraction/invoice-extractor';

describe('Extraction availability', () => {
  const extractor = { extract: jest.fn() } as InvoiceExtractor;
  const account = { id: 'owner', isDemo: false };
  let monthSpendUsd: jest.Mock;

  function availability(config: Partial<ExtractionConfig> = {}, withExtractor: InvoiceExtractor | null = extractor) {
    monthSpendUsd = jest.fn().mockResolvedValue(0.5);
    return new ExtractionAvailabilityService(
      { enabled: true, accountAllowlist: [], monthlyBudgetUsd: 2, model: 'claude-sonnet-5-5', ...config },
      { monthSpendUsd } as unknown as ExtractionJobsService,
      withExtractor,
    );
  }

  it('is available when every gate passes', async () => {
    await expect(availability().unavailableReason(account)).resolves.toBeNull();
  });

  it.each([
    ['the kill switch is off', () => availability({ enabled: false }), account, 'disabled'],
    ['no extractor is registered', () => availability({}, null), account, 'disabled'],
    ['the account is the demo account', () => availability(), { id: 'owner', isDemo: true }, 'demo_account'],
    ['the account is not on a non-empty allow-list', () => availability({ accountAllowlist: ['someone-else'] }), account, 'not_allowed'],
  ])('is unavailable when %s, without querying spend', async (_case, build, who, reason) => {
    await expect(build().unavailableReason(who)).resolves.toBe(reason);
    expect(monthSpendUsd).not.toHaveBeenCalled();
  });

  it('allows accounts on the allow-list', async () => {
    await expect(availability({ accountAllowlist: ['owner'] }).unavailableReason(account)).resolves.toBeNull();
  });

  it.each([[2, 'budget_reached'], [1.99, null]])('with USD %p spent of 2 the reason is %p', async (spent, reason) => {
    const service = availability();
    monthSpendUsd.mockResolvedValue(spent);
    await expect(service.unavailableReason(account)).resolves.toBe(reason);
  });
});
