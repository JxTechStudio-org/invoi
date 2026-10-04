import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 10485760);
const invoiceFilePipe = new ParseFilePipe({
  fileIsRequired: true,
  validators: [
    new MaxFileSizeValidator({ maxSize: maxUploadSize }),
    new FileTypeValidator({
      fileType: /^(application\/pdf|image\/jpeg|image\/png)$/,
      fallbackToMimetype: true,
    }),
  ],
});

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) { }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: maxUploadSize },
    }),
  )
  async upload(
    @UploadedFile(invoiceFilePipe) file: Express.Multer.File,
    @Body() body: UploadInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ invoice_id: string }> {
    const userId = req.user.userId;
    const invoice = await this.invoicesService.createFromUpload(file, userId);
    return { invoice_id: invoice.id };
  }

  @Get()
  list(@Query() query: ListInvoicesQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.list(query, userId);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="invoices.csv"')
  export(
    @Query() query: ListInvoicesQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.export(query, userId);
  }

  @Get(':id/status')
  getStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.getStatus(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.update(id, body, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.invoicesService.delete(id, userId);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.getById(id, userId);
  }
}
