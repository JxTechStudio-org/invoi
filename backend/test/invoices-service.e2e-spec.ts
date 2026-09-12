import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InvoicesService } from '../src/invoices/invoices.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { STORAGE_SERVICE } from '../src/storage/storage.service';

describe('Invoice upload ownership service', () => {
  let service: InvoicesService;
  let upload: jest.Mock;
  let create: jest.Mock;
  let findUser: jest.Mock;
  let remove: jest.Mock;
  const file = { originalname: 'invoice.pdf', buffer: Buffer.from('%PDF-1.4') } as Express.Multer.File;
  const storedFile = { filePath: '/tmp/invoice.pdf', fileUrl: '/uploads/invoice.pdf' };

  beforeEach(async () => {
    upload = jest.fn().mockResolvedValue(storedFile);
    findUser = jest.fn().mockResolvedValue({ id: 'existing-test-owner' });
    remove = jest.fn().mockResolvedValue(undefined);
    create = jest.fn().mockImplementation(({ data }) => Promise.resolve({
      id: 'created-invoice', userId: data.user.connect.id,
      fileUrl: data.fileUrl, status: data.status,
    }));
    const moduleRef = await Test.createTestingModule({ providers: [
      InvoicesService,
      { provide: PrismaService, useValue: { invoice: { create }, user: { findUnique: findUser } } },
      { provide: STORAGE_SERVICE, useValue: { upload, remove } },
    ] }).compile();
    service = moduleRef.get(InvoicesService);
  });

  it.each(['', ' \t '])('refuses empty ownership %p before accessing persistence or storage', async (userId) => {
    await expect(service.createFromUpload(file, userId)).rejects.toBeInstanceOf(BadRequestException);
    expect(findUser).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('connects an invoice to the validated existing user', async () => {
    const invoice = await service.createFromUpload(file, 'existing-test-owner');
    expect(findUser).toHaveBeenCalledWith({
      where: { id: 'existing-test-owner' }, select: { id: true },
    });
    expect(upload).toHaveBeenCalledWith(file);
    expect(create).toHaveBeenCalledWith({ data: {
      fileUrl: '/uploads/invoice.pdf', status: 'processing',
      user: { connect: { id: 'existing-test-owner' } },
    } });
    expect(invoice).toMatchObject({ id: 'created-invoice', userId: 'existing-test-owner' });
    expect(findUser.mock.invocationCallOrder[0]).toBeLessThan(upload.mock.invocationCallOrder[0]);
    expect(upload.mock.invocationCallOrder[0]).toBeLessThan(create.mock.invocationCallOrder[0]);
    expect(remove).not.toHaveBeenCalled();
  });

  it('refuses nonexistent users without storing files or creating invoices', async () => {
    findUser.mockResolvedValue(null);
    await expect(service.createFromUpload(file, 'unknown-user')).rejects.toBeInstanceOf(NotFoundException);
    expect(upload).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('does not store files if the user lookup fails', async () => {
    const error = new Error('Database unavailable');
    findUser.mockRejectedValue(error);
    await expect(service.createFromUpload(file, 'existing-test-owner')).rejects.toBe(error);
    expect(upload).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('removes the stored file when invoice creation fails', async () => {
    const error = new Error('Invoice creation failed');
    create.mockRejectedValue(error);
    await expect(service.createFromUpload(file, 'existing-test-owner')).rejects.toBe(error);
    expect(remove).toHaveBeenCalledWith(storedFile);
  });

  it('preserves the database error if cleanup also fails', async () => {
    const error = new Error('Invoice creation failed');
    create.mockRejectedValue(error);
    remove.mockRejectedValue(new Error('Cleanup failed'));
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      await expect(service.createFromUpload(file, 'existing-test-owner')).rejects.toBe(error);
      expect(log).toHaveBeenCalledWith('Failed to clean up uploaded file after invoice creation failed');
    } finally {
      log.mockRestore();
    }
  });

  it('does not create an invoice when file storage fails', async () => {
    const error = new Error('Storage failed');
    upload.mockRejectedValue(error);
    await expect(service.createFromUpload(file, 'existing-test-owner')).rejects.toBe(error);
    expect(create).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
