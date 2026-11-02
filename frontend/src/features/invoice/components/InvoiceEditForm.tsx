import { Form, Input, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { Invoice } from '../api/invoicesListApi'
import {
    CURRENCY_LABELS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    toOptions
} from '../constants/invoiceLabels'

const TEXT_FIELDS = ['vendorName', 'invoiceNumber', 'customerName', 'taxNumber', 'crNumber'] as const
const DATE_FIELDS = ['invoiceDate', 'dueDate'] as const
const AMOUNT_FIELDS = ['totalAmount', 'taxAmount', 'amountPaid'] as const
const ENUM_FIELDS = ['currency', 'paymentStatus', 'paymentMethod'] as const
const EDITABLE_FIELDS = [...TEXT_FIELDS, ...DATE_FIELDS, ...AMOUNT_FIELDS, ...ENUM_FIELDS]

type EditableField = typeof EDITABLE_FIELDS[number]
export type InvoiceFormValues = Partial<Record<EditableField, string | null>>
export type InvoiceUpdatePayload = Partial<Record<EditableField, string | null>>

// Same rule as the backend InvoiceAmountConstraint: up to 10 integer digits, 2 decimals.
const AMOUNT_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/

export function invoiceToFormValues(invoice: Invoice): InvoiceFormValues {
    const values: InvoiceFormValues = {}
    for (const field of EDITABLE_FIELDS) {
        const value = invoice[field]
        // Dates arrive as ISO timestamps; the date input needs YYYY-MM-DD.
        values[field] = value && (DATE_FIELDS as readonly string[]).includes(field) ? value.slice(0, 10) : value
    }
    return values
}

function normalize(values: InvoiceFormValues): InvoiceUpdatePayload {
    const payload: InvoiceUpdatePayload = {}
    for (const field of EDITABLE_FIELDS) {
        const value = values[field]
        const trimmed = typeof value === 'string' ? value.trim() : value
        payload[field] = trimmed === '' || trimmed === undefined ? null : trimmed
    }
    return payload
}

/** Only the fields the user actually changed, with empty inputs sent as null (clears the field). */
export function buildInvoiceUpdate(invoice: Invoice, values: InvoiceFormValues): InvoiceUpdatePayload {
    const before = normalize(invoiceToFormValues(invoice))
    const after = normalize(values)
    const changes: InvoiceUpdatePayload = {}
    for (const field of EDITABLE_FIELDS) {
        const a = before[field] ?? null
        const b = after[field] ?? null
        // "100" and "100.00" are the same amount.
        const sameAmount = (AMOUNT_FIELDS as readonly string[]).includes(field)
            && a !== null && b !== null && Number(a) === Number(b)
        if (a !== b && !sameAmount) changes[field] = b
    }
    return changes
}

const amountRules = [{ pattern: AMOUNT_PATTERN, message: 'أدخل مبلغًا صحيحًا (رقم موجب بحد أقصى خانتين عشريتين)' }]

interface InvoiceEditFormProps {
    form: FormInstance<InvoiceFormValues>
    initialValues: InvoiceFormValues
    onFinish: (values: InvoiceFormValues) => void
}

export default function InvoiceEditForm({ form, initialValues, onFinish }: InvoiceEditFormProps) {
    return (
        // The modal unmounts its content when hidden, so each open starts from the current invoice.
        <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onFinish}>
            <Form.Item name="vendorName" label="اسم المورد">
                <Input />
            </Form.Item>
            <Form.Item name="taxNumber" label="الرقم الضريبي للمورد">
                <Input />
            </Form.Item>
            <Form.Item name="crNumber" label="رقم السجل التجاري للمورد">
                <Input />
            </Form.Item>
            <Form.Item name="invoiceNumber" label="رقم الفاتورة">
                <Input />
            </Form.Item>
            <Form.Item name="customerName" label="اسم العميل (كما في الفاتورة)">
                <Input />
            </Form.Item>
            <Form.Item name="invoiceDate" label="تاريخ الفاتورة">
                <Input type="date" />
            </Form.Item>
            <Form.Item
                name="dueDate"
                label="تاريخ الاستحقاق"
                dependencies={['invoiceDate']}
                rules={[({ getFieldValue }) => ({
                    validator(_, value) {
                        const invoiceDate = getFieldValue('invoiceDate')
                        if (!value || !invoiceDate || value >= invoiceDate) return Promise.resolve()
                        return Promise.reject(new Error('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الفاتورة'))
                    }
                })]}
            >
                <Input type="date" />
            </Form.Item>
            <Form.Item name="totalAmount" label="المبلغ الإجمالي" rules={amountRules}>
                <Input inputMode="decimal" />
            </Form.Item>
            <Form.Item name="taxAmount" label="قيمة الضريبة" rules={amountRules}>
                <Input inputMode="decimal" />
            </Form.Item>
            <Form.Item name="amountPaid" label="المبلغ المدفوع" rules={amountRules}>
                <Input inputMode="decimal" />
            </Form.Item>
            <Form.Item name="currency" label="العملة">
                <Select allowClear options={toOptions(CURRENCY_LABELS)} />
            </Form.Item>
            <Form.Item name="paymentStatus" label="حالة الدفع">
                <Select allowClear options={toOptions(PAYMENT_STATUS_LABELS)} />
            </Form.Item>
            <Form.Item name="paymentMethod" label="طريقة الدفع">
                <Select allowClear options={toOptions(PAYMENT_METHOD_LABELS)} />
            </Form.Item>
        </Form>
    )
}
