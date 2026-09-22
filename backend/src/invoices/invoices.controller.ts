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
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UploadInvoiceDto } from './dto/upload-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

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

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="invoices.csv"')
  export(@Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.export(query);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.invoicesService.getStatus(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateInvoiceDto) {
    return this.invoicesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.invoicesService.delete(id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.invoicesService.getById(id);
  }
}
