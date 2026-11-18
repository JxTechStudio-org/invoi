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
        // When ANALYTICS_MOCK=true, return mock data without making external calls
        if (process.env.ANALYTICS_MOCK === 'true') {
            return this.mock(dto.type, dto.question);
        }

        const isCustom = dto.type === 'custom_question';

        // Select the appropriate webhook URL (type-specific first, with fallback to default)
        const url = isCustom
            ? (process.env.N8N_AI_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL)
            : (process.env.N8N_DPO_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL);

        // Select the matching secret key
        const secret = isCustom
            ? (process.env.N8N_AI_SECRET || process.env.N8N_SECRET)
            : (process.env.N8N_DPO_SECRET || process.env.N8N_SECRET);

        if (!url || !secret) {
            this.logger.error('N8N webhook configuration is missing');
            throw new InternalServerErrorException('خدمة التحليل غير مهيأة');
        }

        const timeoutMs = Number(process.env.N8N_TIMEOUT_MS ?? 120000);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);

        try {
            // Format the request payload according to each webhook specification
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

    // Mock data for UI development and testing without consuming any balance
    private async mock(type: AnalyticsType, question?: string) {
        await new Promise((r) => setTimeout(r, 1200));

        const now = new Date().toISOString();

        if (type === 'custom_question') {
            return {
                type,
                title: 'تحليل المساعد الذكي للفواتير',
                generatedAt: now,
                kpis: [
                    { label: 'الفواتير المفحوصة', value: 2000, unit: 'invoices' },
                    { label: 'الموردين النشطين', value: 45, unit: 'invoices' },
                    { label: 'متوسط الفاتورة', value: 12450, unit: 'SAR' },
                ],
                chart: {
                    kind: 'bar',
                    items: [
                        { label: 'فواتير مكتملة', value: 1840 },
                        { label: 'تحتاج مراجعة', value: 110 },
                        { label: 'معلقة للسداد', value: 50 },
                    ],
                },
                report: `## إجابة المساعد الذكي
بناءً على فحص سجلات الفواتير، تم تحليل استفسارك: **"${question || 'استفسار عام عن الفواتير'}"**.

### ملخص النتائج والتحليل:
* تم فحص جميع الفواتير المسجلة في حسابك ومطابقتها مع الموردين.
* أعلى مورد متأخر في السداد حالياً هو **شركة التقنية الحديثة للتوريدات** بمبلغ إجمالي قدره **142,500 ر.س**.
* نسبة الالتزام بمواعيد الاستحقاق العامة تبلغ **88%**.

### التوصيات المقترحة:
1. مراجعة أوامر الصرف العاجلة الخاصة بالموردين الرئيسيين.
2. استخدام صفحة **الموردون** لمتابعة الدفعات المجدولة خلال الأسبوع الحالي.

> 💡 **ملاحظة:** التحليل مولّد آلياً بواسطة المساعد الذكي في invoi.`,
            };
        }

        if (type === 'dpo_aging') {
            return {
                type,
                title: 'تحليل أعمار الديون و DPO',
                generatedAt: now,
                kpis: [
                    { label: 'DPO (يوم)', value: 0, unit: 'days' },
                    { label: 'المستحق (SAR)', value: 1734830.84, unit: 'SAR' },
                    { label: 'فواتير حرجة', value: 8, unit: 'invoices' },
                ],
                chart: {
                    kind: 'bar',
                    items: [
                        { label: 'حالية', value: 1518554.34 },
                        { label: '1–30 يوم', value: 216276.5 },
                        { label: '31–60 يوم', value: 0 },
                        { label: '+60 يوم', value: 0 },
                    ],
                },
                report: `## تحليل أعمار الديون و DPO
تم حساب مؤشر DPO بنجاح وحصره بـ **0 يوم**. إجمالي المبالغ الحرجة يتضمن **8 فواتير** تتطلب المراجعة الفورية.

### التوزيع الزمني للمستحقات:
| الفترة | القيمة (ر.س) | الحالة |
| :--- | :--- | :--- |
| حالية | 1,518,554.34 | منتظمة |
| 1–30 يوم | 216,276.50 | معتدلة |
| 31–60 يوم | 0.00 | منتظمة |
| +60 يوم | 0.00 | منتظمة |

### أهم التوصيات:
* مراجعة الفواتير الحرجة الـ 8 لتأكيد إجراءات السداد في المواعيد المقررة.
* الحفاظ على معدل الـ DPO الحالي لتعزيز الثقة مع الموردين.

> 💡 **تنبيه:** يرجى مراجعة الفواتير المصنفة كحرجة لضمان استمرار التدفقات النقدية السليمة.`,
            };
        }

        if (type === 'top_suppliers') {
            return {
                type,
                title: 'أبرز الموردين',
                generatedAt: now,
                kpis: [
                    { label: 'إجمالي الموردين', value: 45, unit: 'invoices' },
                    { label: 'أعلى تعامل', value: 680000, unit: 'SAR' },
                    { label: 'موردين عليهم مستحقات', value: 12, unit: 'invoices' },
                ],
                chart: {
                    kind: 'bar',
                    items: [
                        { label: 'شركة الاتصالات', value: 680000 },
                        { label: 'مؤسسة الحلول المتقدمة', value: 420000 },
                        { label: 'شركة الإمداد اللوجستي', value: 310000 },
                        { label: 'توريدات الشرق', value: 185000 },
                    ],
                },
                report: `## تقرير أبرز الموردين
يوضح هذا التقرير الموردين الأكثر تعاملاً من حيث إجمالي المبالغ المفصلة في الفواتير.

### تفاصيل الموردين الرئيسيين:
* **شركة الاتصالات:** تمثل 39% من إجمالي المشتريات الشهرية.
* **مؤسسة الحلول المتقدمة:** جميع فواتيرها معتمدة ومنتظمة في السداد.
* **شركة الإمداد اللوجستي:** تتضمن فاتورتين تحت المراجعة.

> 💡 **توصية:** تفاوض على خصومات الشراء المجمع مع الموردين ذوي التعاملات الكبرى.`,
            };
        }

        if (type === 'invoices_review') {
            return {
                type,
                title: 'مراجعة الفواتير',
                generatedAt: now,
                kpis: [
                    { label: 'تحتاج مراجعة', value: 14, unit: 'invoices' },
                    { label: 'نسبة الدقة', value: '98.5%', unit: '' },
                    { label: 'مكتملة التدقيق', value: 1986, unit: 'invoices' },
                ],
                chart: {
                    kind: 'bar',
                    items: [
                        { label: 'بيانات غير مكتملة', value: 6 },
                        { label: 'عدم تطابق الضريبة', value: 5 },
                        { label: 'تكرار محتمل', value: 3 },
                    ],
                },
                report: `## تقرير الفواتير التي تحتاج مراجعة
تم فحص الفواتير ومطابقتها مع اشتراطات هيئة الزكاة والضريبة والجمارك (ZATCA).

### ملاحظات المراجعة الآلية:
1. **6 فواتير** تحتاج استكمال الرقم الضريبي أو عنوان المورد.
2. **5 فواتير** يوجد بها فارق هللات في احتساب ضريبة القيمة المضافة (15%).
3. **3 فواتير** تحمل أرقاماً متطابقة تم رفعها مسبقاً.

> 💡 **إجراء مطلوب:** الدخول إلى شاشة **الفواتير** وتصفية القائمة بحسب حالة "تحتاج مراجعة" لاعتمادها يدوياً.`,
            };
        }

        // Default to ap_summary
        return {
            type,
            title: 'ملخص الحسابات الدائنة',
            generatedAt: now,
            kpis: [
                { label: 'إجمالي الذمم', value: 3250000, unit: 'SAR' },
                { label: 'فواتير مستحقة', value: 120, unit: 'invoices' },
                { label: 'مدفوعة هذا الشهر', value: 850000, unit: 'SAR' },
            ],
            chart: {
                kind: 'bar',
                items: [
                    { label: 'أسبوع 1', value: 750000 },
                    { label: 'أسبوع 2', value: 920000 },
                    { label: 'أسبوع 3', value: 640000 },
                    { label: 'أسبوع 4', value: 940000 },
                ],
            },
            report: `## ملخص الحسابات الدائنة (AP Summary)
نظرة عامة وشاملة على التزامات الشركة المالية تجاه الموردين خلال الشهر الحالي.

### أبرز المؤشرات:
* يبلغ إجمالي الالتزامات المالية القائمة **3,250,000 ر.س**.
* تم سداد ما نسبته **26%** من إجمالي مستحقات الشهر.
* التدفقات النقدية الخارجة متوازنة عبر الأسابيع الأربعة.`,
        };
    }
}
