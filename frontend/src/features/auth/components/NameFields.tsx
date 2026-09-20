import { Form, Input, theme } from 'antd'

export default function NameFields({ isMobile }: { isMobile: boolean }) {
    const { token } = theme.useToken()

    const nameRules = (label: string) => [
        { required: true, message: `الرجاء إدخال ${label}` },
        { pattern: /^[\u0621-\u064A\s]+$/, message: 'يجب إدخال أحرف عربية فقط' },
        {
            validator: (_: unknown, value: string) => {
                if (!value) return Promise.resolve()
                if (value.length < 2) {
                    return Promise.reject(new Error('يجب أن يتكون الاسم من حرفين على الأقل'))
                }
                if (value.startsWith(' ') || value.endsWith(' ')) {
                    return Promise.reject(new Error('يجب ألا يبدأ أو ينتهي الاسم بمسافة'))
                }
                return Promise.resolve()
            }
        }
    ]

    return (
        <>
            <Form.Item label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>الاسم الأول</span>} name="first_name" validateTrigger="onChange" rules={nameRules('الاسم الأول')} hasFeedback>
                <Input placeholder="مثال: أحمد" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
            </Form.Item>

            <Form.Item label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>الاسم الأخير</span>} name="last_name" validateTrigger="onChange" rules={nameRules('الاسم الأخير')} hasFeedback>
                <Input placeholder="مثال: العتيبي" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
            </Form.Item>
        </>
    )
}
