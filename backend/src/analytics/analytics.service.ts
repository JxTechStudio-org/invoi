import {
    BadGatewayException,
    GatewayTimeoutException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { AnalyticsRequestDto } from './dto/analytics.dto';
import { getMockAnalyticsResponse } from './analytics.mock';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    async run(userId: string, dto: AnalyticsRequestDto) {
        // When ANALYTICS_MOCK=true, return mock data without making external calls
        if (process.env.ANALYTICS_MOCK === 'true') {
            return getMockAnalyticsResponse(dto.type, dto.question);
        }

        const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
        const secret = process.env.N8N_SHARED_SECRET;

        if (!baseUrl || !secret) {
            this.logger.error('N8N webhook configuration is missing');
            throw new InternalServerErrorException('خدمة التحليل غير مهيأة');
        }

        const url = `${baseUrl.replace(/\/+$/, '')}/${dto.type}`;
        const timeoutMs = Number(process.env.N8N_TIMEOUT_MS ?? 180000);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);

        try {
            const isCustom = dto.type === 'custom_question';
            const payload = isCustom
                ? { userId, question: dto.question }
                : { userId, type: dto.type };

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
                this.logger.error(`n8n responded ${res.status}`);
                throw new BadGatewayException('فشل تنفيذ التحليل، حاول مرة ثانية');
            }
            return await res.json();
        } catch (e: unknown) {
            if (e instanceof HttpException) throw e;
            if (e instanceof Error && e.name === 'AbortError') {
                throw new GatewayTimeoutException('التحليل أخذ وقتاً أطول من المتوقع');
            }
            this.logger.error(e);
            throw new BadGatewayException('تعذر الوصول لخدمة التحليل');
        } finally {
            clearTimeout(timer);
        }
    }
}
