import {
    BadGatewayException,
    GatewayTimeoutException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { AnalyticsRequestDto, AnalyticsType } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    async run(userId: string, dto: AnalyticsRequestDto) {
        // // when ANALYTICS_MOCK=true in .env, return fake data instead of calling n8n
        if (process.env.ANALYTICS_MOCK === 'true') {
            return this.mock(dto.type);
        }

        const url = process.env.N8N_WEBHOOK_URL;
        const secret = process.env.N8N_SECRET;
        if (!url || !secret) {
            this.logger.error('N8N_WEBHOOK_URL or N8N_SECRET is missing');
            throw new InternalServerErrorException('خدمة التحليل غير مهيأة');
        }
        const timeoutMs = Number(process.env.N8N_TIMEOUT_MS ?? 120000);

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Invoi-Secret': secret,
                },
                body: JSON.stringify({
                    userId,
                    type: dto.type,
                    question: dto.question,
                }),
                signal: ctrl.signal,
            });

            if (!res.ok) {
                this.logger.error(`n8n responded ${res.status}`);
                throw new BadGatewayException('فشل تنفيذ التحليل، حاول مرة ثانية');
            }
            return await res.json();
        } catch (e: any) {
            if (e instanceof HttpException) throw e;
            if (e?.name === 'AbortError') {
                throw new GatewayTimeoutException('التحليل أخذ وقت أطول من المتوقع');
            }
            this.logger.error(e);
            throw new BadGatewayException('تعذر الوصول لخدمة التحليل');
        } finally {
            clearTimeout(timer);
        }
    }
    // mock function: i will need it when i build frontend
    private async mock(type: AnalyticsType) {
        await new Promise((r) => setTimeout(r, 1500)); // تقليد التأخير
        return {
            type,
            title: 'DPO وأعمار المستحقات',
            generatedAt: new Date().toISOString(),
            kpis: [
                { label: 'DPO', value: 43, unit: 'days' },
                { label: 'المستحق', value: 5300000, unit: 'SAR' },
                { label: 'متأخرة +90 يوم', value: 88, unit: 'invoices' },
            ],
            chart: {
                kind: 'bar',
                items: [
                    { label: 'حالية', value: 2400000 },
                    { label: '1–30', value: 1200000 },
                    { label: '31–60', value: 300000 },
                    { label: '90+', value: 755720.48 },
                ],
            },
            report: '## الملخص\nهذا تقرير تجريبي.',
        };
    }
}