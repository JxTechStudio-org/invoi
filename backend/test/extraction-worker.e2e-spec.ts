import { extractionConfigFromEnvironment } from '../src/extraction/extraction.config';
import { ExtractionJobsService } from '../src/extraction/extraction-jobs.service';
import { ExtractionWorkerService } from '../src/extraction/extraction-worker.service';
import { InvoiceExtractor } from '../src/extraction/invoice-extractor';
import { MetricsService } from '../src/metrics/metrics.service';
import { StorageService } from '../src/storage/storage.service';

describe('Extraction configuration', () => {
  it('is off by default with a USD 2 budget and every account allowed', () => {
    expect(extractionConfigFromEnvironment({})).toEqual({
      enabled: false, accountAllowlist: [], monthlyBudgetUsd: 2, model: 'claude-sonnet-5-5',
    });
  });

  it('reads the kill switch, allow-list and budget', () => {
    expect(extractionConfigFromEnvironment({
      EXTRACTION_ENABLED: ' TRUE ', EXTRACTION_ACCOUNT_ALLOWLIST: ' user-1, ,user-2 ',
      EXTRACTION_MONTHLY_BUDGET_USD: '5.5', EXTRACTION_MODEL: 'claude-haiku-5-5',
    })).toEqual({
      enabled: true, accountAllowlist: ['user-1', 'user-2'], monthlyBudgetUsd: 5.5, model: 'claude-haiku-5-5',
    });
  });

  it.each([
    [{ EXTRACTION_ENABLED: 'yes' }, 'EXTRACTION_ENABLED must be true or false'],
    [{ EXTRACTION_MONTHLY_BUDGET_USD: '-1' }, 'non-negative number'],
    [{ EXTRACTION_MONTHLY_BUDGET_USD: 'two' }, 'non-negative number'],
    [{ EXTRACTION_MODEL: 'claude-opus-5-5' }, 'EXTRACTION_MODEL must be one of'],
  ])('rejects invalid settings %p', (environment, message) => {
    expect(() => extractionConfigFromEnvironment(environment)).toThrow(message);
  });
});

describe('Extraction worker startup', () => {
  const jobs = { claimNext: jest.fn(), monthSpendUsd: jest.fn(), failOrphans: jest.fn(), findStale: jest.fn() };
  const extractor: InvoiceExtractor = { extract: jest.fn() };

  function worker(enabled: boolean, withExtractor: boolean) {
    return new ExtractionWorkerService(
      { enabled, accountAllowlist: [], monthlyBudgetUsd: 2, model: 'claude-sonnet-5-5' },
      jobs as unknown as ExtractionJobsService, {} as StorageService, new MetricsService(),
      withExtractor ? extractor : null,
    );
  }

  beforeEach(() => jest.clearAllMocks());

  it.each([[false, true], [true, false]])(
    'does not poll when enabled=%p and extractor available=%p', async (enabled, withExtractor) => {
      const instance = worker(enabled, withExtractor);
      instance.onApplicationBootstrap();
      await instance.tick();
      await instance.onApplicationShutdown();
      expect(jobs.claimNext).not.toHaveBeenCalled();
      expect(jobs.monthSpendUsd).not.toHaveBeenCalled();
    },
  );

  it('polls once enabled with an extractor, and stops on shutdown', async () => {
    jobs.failOrphans.mockResolvedValue(0);
    jobs.findStale.mockResolvedValue([]);
    jobs.monthSpendUsd.mockResolvedValue(0);
    jobs.claimNext.mockResolvedValue(null);
    const instance = worker(true, true);
    instance.onApplicationBootstrap();
    await instance.onApplicationShutdown();
    await new Promise(resolveTick => setImmediate(resolveTick));
    expect(jobs.claimNext).toHaveBeenCalledWith([]);
  });
});
