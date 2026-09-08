import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.service';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

  async createFromUpload(file: Express.Multer.File): Promise<Invoice> {
    const storedFile = await this.storageService.upload(file);

    return this.prisma.invoice.create({
      data: {
        fileUrl: storedFile.fileUrl,
        status: InvoiceStatus.processing,
      },
    });
  }

  list(query: ListInvoicesQueryDto): Promise<Invoice[]> {
    const where: Prisma.InvoiceWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.invoiceDate = { gte: start, lt: end };
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} was not found`);
    }

    return invoice;
  }
}
