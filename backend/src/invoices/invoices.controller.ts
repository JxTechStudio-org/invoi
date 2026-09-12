import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { InvoicesService } from './invoices.service';

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

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

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
  ): Promise<{ invoice_id: string }> {
    const invoice = await this.invoicesService.createFromUpload(file, body.userId);
    return { invoice_id: invoice.id };
  }

  @Get()
  list(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.invoicesService.getById(id);
  }
}
