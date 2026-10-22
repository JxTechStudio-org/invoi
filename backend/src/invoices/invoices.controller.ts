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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
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

  @Get(':id/file')
  async getFile(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const userId = req.user.userId;
    const file = await this.invoicesService.getFile(id, userId);
    // Uploaded files are untrusted: never let the browser sniff them into HTML.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.stream, {
      type: file.contentType,
      length: file.contentLength,
      disposition: 'inline',
    });
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

  @Post(':id/approve')
  @HttpCode(200)
  approve(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.approve(id, userId);
  }

  @Post(':id/flag')
  @HttpCode(200)
  flag(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.invoicesService.flag(id, userId);
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
