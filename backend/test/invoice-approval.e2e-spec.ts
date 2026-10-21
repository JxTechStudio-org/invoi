import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { InvoicesService } from '../src/invoices/invoices.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { STORAGE_SERVICE } from '../src/storage/storage.service';
import { invoiceFixture } from './fixtures/invoice';

describe('Invoice approval and flagging', () => {
  let service: InvoicesService;
  let findUnique: jest.Mock;
  let update: jest.Mock;

  beforeEach(async () => {
    findUnique = jest.fn();
    update = jest.fn().mockImplementation(({ data }) => Promise.resolve(invoiceFixture(data)));
    const moduleRef = await Test.createTestingModule({ providers: [
      InvoicesService,
      { provide: PrismaService, useValue: { invoice: { findUnique, update } } },
      { provide: STORAGE_SERVICE, useValue: {} },
    ] }).compile();
    service = moduleRef.get(InvoicesService);
  });

  it('approves a flagged invoice, overriding its review reasons', async () => {
    findUnique.mockResolvedValue(invoiceFixture({
      status: 'needs_review', needsReviewReason: 'amount_threshold_exceeded,user_flagged',
    }));
    const result = await service.approve('test-invoice', 'test-owner');
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'test-invoice', userId: 'test-owner' } });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'test-invoice' }, data: { status: 'completed', needsReviewReason: null },
    });
    expect(result).toMatchObject({ status: 'completed', needsReviewReason: null });
  });

  it.each([
    [{ vendorName: null }, 'vendorName'],
    [{ vendorName: '  ' }, 'vendorName'],
    [{ totalAmount: null }, 'totalAmount'],
    [{ invoiceDate: null }, 'invoiceDate'],
    [{ vendorName: null, totalAmount: null, invoiceDate: null }, 'vendorName, totalAmount, invoiceDate'],
  ])('refuses approval without required data %p', async (changes, missing) => {
    findUnique.mockResolvedValue(invoiceFixture({ status: 'processing', ...changes }));
    const approval = service.approve('test-invoice', 'test-owner');
    await expect(approval).rejects.toBeInstanceOf(BadRequestException);
    await expect(approval).rejects.toThrow(`without: ${missing}`);
    expect(update).not.toHaveBeenCalled();
  });

  it('allows approval when the total is zero', async () => {
    findUnique.mockResolvedValue(invoiceFixture({ totalAmount: new Prisma.Decimal('0') }));
    await expect(service.approve('test-invoice', 'test-owner')).resolves.toMatchObject({ status: 'completed' });
  });

  it.each(['approve', 'flag'] as const)('%s returns 404 for invoices the user does not own', async action => {
    findUnique.mockResolvedValue(null);
    await expect(service[action]('other-invoice', 'test-owner')).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    [null, 'user_flagged'],
    ['customer_name_mismatch', 'customer_name_mismatch,user_flagged'],
    ['user_flagged', 'user_flagged'],
  ])('flags an invoice for review keeping existing reasons: %p', async (existing, expected) => {
    findUnique.mockResolvedValue({ needsReviewReason: existing });
    await service.flag('test-invoice', 'test-owner');
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'test-invoice', userId: 'test-owner' }, select: { needsReviewReason: true },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'test-invoice' }, data: { status: 'needs_review', needsReviewReason: expected },
    });
  });

  it('maps a concurrent delete during approval to 404', async () => {
    findUnique.mockResolvedValue(invoiceFixture());
    update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('gone', { code: 'P2025', clientVersion: 'test' }));
    await expect(service.approve('test-invoice', 'test-owner')).rejects.toBeInstanceOf(NotFoundException);
  });
});
