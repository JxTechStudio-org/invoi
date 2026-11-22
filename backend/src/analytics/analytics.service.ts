import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsRequestDto } from './dto/analytics.dto';
import { getMockAnalyticsResponse } from './analytics.mock';

@Injectable()
export class AnalyticsService implements OnModuleInit {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        const timeoutMs = Number(process.env.N8N_TIMEOUT_MS ?? 180000);
        const cutoff = new Date(Date.now() - timeoutMs);
        try {
            const res = await this.prisma.analysisJob.updateMany({
                where: {
                    status: 'pending',
                    createdAt: { lt: cutoff },
                },
                data: {
                    status: 'failed',
                    error: 'انتهت مهلة التحليل بسبب إعادة تشغيل الخدمة',
                    completedAt: new Date(),
                },
            });
            if (res.count > 0) {
                this.logger.log(`Marked ${res.count} stale pending analysis jobs as failed on startup`);
            }
        } catch (e: unknown) {
            this.logger.error('Failed to clean up stale pending jobs on startup', e);
        }
    }

    async createJob(userId: string, dto: AnalyticsRequestDto): Promise<{ jobId: string }> {
        const isMock = process.env.ANALYTICS_MOCK === 'true';

        // Enforce per-user daily limit for non-mock runs
        if (!isMock) {
            const dailyLimit = Number(process.env.ANALYTICS_DAILY_LIMIT ?? 5);
            const startOfDay = new Date();
            startOfDay.setUTCHours(0, 0, 0, 0);

            const jobsTodayCount = await this.prisma.analysisJob.count({
                where: {
                    userId,
                    createdAt: { gte: startOfDay },
                },
            });

            if (jobsTodayCount >= dailyLimit) {
                throw new HttpException(
                    `لقد وصلت إلى الحد اليومي المسموح به للتحليلات (${dailyLimit} تحليلات يومياً)`,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
        }

        const job = await this.prisma.analysisJob.create({
            data: {
                userId,
                type: dto.type,
                question: dto.question ?? null,
                status: 'pending',
            },
        });

        // Trigger processing in the background without holding open the HTTP request
        void this.processJob(job.id, userId, dto).catch((err) => {
            this.logger.error(`Background processing unhandled error for job ${job.id}`, err);
        });

        return { jobId: job.id };
    }

    async getJob(userId: string, jobId: string) {
        const job = await this.prisma.analysisJob.findFirst({
            where: {
                id: jobId,
                userId,
            },
            select: {
                id: true,
                type: true,
                question: true,
                status: true,
                result: true,
                error: true,
                createdAt: true,
                completedAt: true,
            },
        });

        if (!job) {
            throw new NotFoundException('المهمة غير موجودة');
        }

        return job;
    }

    async getLatest(userId: string): Promise<Record<string, unknown>> {
        const completedJobs = await this.prisma.analysisJob.findMany({
            where: {
                userId,
                status: 'completed',
                result: { not: Prisma.DbNull },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const latestMap: Record<string, unknown> = {};
        for (const job of completedJobs) {
            if (!latestMap[job.type] && job.result) {
                latestMap[job.type] = job.result;
            }
        }

        return latestMap;
    }

    private async processJob(jobId: string, userId: string, dto: AnalyticsRequestDto): Promise<void> {
        const isMock = process.env.ANALYTICS_MOCK === 'true';

        if (isMock) {
            const mockResult = await getMockAnalyticsResponse(dto.type, dto.question);
            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    result: mockResult as unknown as Prisma.InputJsonValue,
                    completedAt: new Date(),
                },
            });
            return;
        }

        // Live mode: load user's invoices excluding processing status
        const rawInvoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                status: { not: 'processing' },
            },
            select: {
                vendorName: true,
                invoiceNumber: true,
                invoiceDate: true,
                dueDate: true,
                totalAmount: true,
                taxAmount: true,
                amountPaid: true,
                currency: true,
                paymentStatus: true,
                paidAt: true,
                status: true,
            },
        });

        const invoices = rawInvoices.map((inv) => ({
            vendorName: inv.vendorName,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate ? inv.invoiceDate.toISOString() : null,
            dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
            totalAmount: inv.totalAmount ? Number(inv.totalAmount) : null,
            taxAmount: inv.taxAmount ? Number(inv.taxAmount) : null,
            amountPaid: inv.amountPaid ? Number(inv.amountPaid) : null,
            currency: inv.currency,
            paymentStatus: inv.paymentStatus,
            paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
            status: inv.status,
        }));

        this.logger.log(`Dispatching analysis job ${jobId} (type: ${dto.type}, invoiceCount: ${invoices.length})`);

        const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
        const secret = process.env.N8N_SHARED_SECRET;

        if (!baseUrl || !secret) {
            this.logger.error(`N8N configuration is missing for job ${jobId}`);
            await this.markJobFailed(jobId, 'خدمة التحليل غير مهيأة');
            return;
        }

        const url = `${baseUrl.replace(/\/+$/, '')}/${dto.type}`;
        const timeoutMs = Number(process.env.N8N_TIMEOUT_MS ?? 180000);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);

        try {
            const payload = {
                jobId,
                userId,
                type: dto.type,
                question: dto.question,
                invoices,
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Invoi-Secret': secret,
                },
                body: JSON.stringify(payload),
                signal: ctrl.signal,
            });

            if (!res.ok) {
                this.logger.error(`n8n responded ${res.status} for job ${jobId} (type: ${dto.type})`);
                await this.markJobFailed(jobId, 'فشل تنفيذ التحليل من الخادم');
                return;
            }

            let data: unknown;
            try {
                data = await res.json();
            } catch (parseErr) {
                this.logger.error(`Failed to parse n8n JSON response for job ${jobId} (type: ${dto.type})`, parseErr);
                await this.markJobFailed(jobId, 'استجابة التحليل غير صالحة');
                return;
            }

            const validation = this.validateResponse(data, dto.type);
            if (!validation.isValid) {
                this.logger.error(`Invalid n8n response shape for job ${jobId} (type: ${dto.type}): ${validation.reason}`);
                await this.markJobFailed(jobId, 'تنسيق نتيجة التحليل غير صالح');
                return;
            }

            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    result: data as Prisma.InputJsonValue,
                    completedAt: new Date(),
                },
            });
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                this.logger.error(`Job ${jobId} timed out after ${timeoutMs}ms`);
                await this.markJobFailed(jobId, 'التحليل أخذ وقتاً أطول من المتوقع');
                return;
            }
            this.logger.error(`Failed to reach n8n for job ${jobId}: ${String(err)}`);
            await this.markJobFailed(jobId, 'تعذر الوصول لخدمة التحليل');
        } finally {
            clearTimeout(timer);
        }
    }

    private validateResponse(data: unknown, requestedType: string): { isValid: boolean; reason?: string } {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { isValid: false, reason: 'Response must be a single JSON object' };
        }

        const obj = data as Record<string, unknown>;

        if (obj.type !== requestedType) {
            return { isValid: false, reason: `Response type "${String(obj.type)}" does not match requested "${requestedType}"` };
        }

        if (typeof obj.title !== 'string' || !obj.title.trim()) {
            return { isValid: false, reason: 'Response title must be a non-empty string' };
        }

        const hasKpis = Array.isArray(obj.kpis);
        const chartObj = obj.chart && typeof obj.chart === 'object' ? (obj.chart as Record<string, unknown>) : null;
        const hasChart = chartObj && Array.isArray(chartObj.items);
        const hasReport = typeof obj.report === 'string' && obj.report.trim().length > 0;

        if (!hasKpis && !hasChart && !hasReport) {
            return { isValid: false, reason: 'Response must contain at least one of kpis, chart, or report' };
        }

        if (hasKpis) {
            for (const kpi of obj.kpis as unknown[]) {
                if (
                    !kpi ||
                    typeof kpi !== 'object' ||
                    typeof (kpi as Record<string, unknown>).label !== 'string' ||
                    (kpi as Record<string, unknown>).value === undefined
                ) {
                    return { isValid: false, reason: 'Each kpi item must have a string label and a value' };
                }
            }
        }

        if (hasChart && chartObj) {
            for (const item of chartObj.items as unknown[]) {
                if (
                    !item ||
                    typeof item !== 'object' ||
                    typeof (item as Record<string, unknown>).label !== 'string' ||
                    typeof (item as Record<string, unknown>).value !== 'number'
                ) {
                    return { isValid: false, reason: 'Each chart item must have a string label and a numeric value' };
                }
            }
        }

        return { isValid: true };
    }

    private async markJobFailed(jobId: string, errorMessage: string): Promise<void> {
        try {
            await this.prisma.analysisJob.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    error: errorMessage,
                    completedAt: new Date(),
                },
            });
        } catch (e: unknown) {
            this.logger.error(`Failed to mark job ${jobId} as failed`, e);
        }
    }
}
