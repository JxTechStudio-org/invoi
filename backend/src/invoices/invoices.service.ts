import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.service';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';

type InvoiceResponse = Invoice & {
  sellerName: Invoice['vendorName'];
  amount: Invoice['totalAmount'];
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
  ) {}

  async createFromUpload(file: Express.Multer.File, userId: string): Promise<Invoice> {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new BadRequestException('userId must be a non-empty string');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found`);
    }

    const storedFile = await this.storageService.upload(file);

    try {
      return await this.prisma.invoice.create({
        data: {
          fileUrl: storedFile.fileUrl,
          status: InvoiceStatus.processing,
          user: { connect: { id: user.id } },
        },
      });
    } catch (error) {
      try {
        await this.storageService.remove(storedFile);
      } catch {
        this.logger.error('Failed to clean up uploaded file after invoice creation failed');
      }
      throw error;
    }
  }

  async list(query: ListInvoicesQueryDto): Promise<InvoiceResponse[]> {
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

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map((invoice) => this.toResponse(invoice));
  }

  async getById(id: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} was not found`);
    }

    return this.toResponse(invoice);
  }

  private toResponse(invoice: Invoice): InvoiceResponse {
    // Keep existing API consumers compatible with the v2 field names.
    return { ...invoice, sellerName: invoice.vendorName, amount: invoice.totalAmount };
  }
}
