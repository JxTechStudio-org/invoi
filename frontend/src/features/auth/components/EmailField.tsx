import { Form, Input, theme } from 'antd'
import { MailOutlined } from '@ant-design/icons'

export default function EmailField() {
    const { token } = theme.useToken()

    return (
        <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>البريد الإلكتروني</span>}
            name="email"
            validateTrigger="onChange"
            rules={[
                { required: true, message: 'الرجاء إدخال البريد الإلكتروني' },
                {
                    validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                        if (!emailRegex.test(value)) {
                            return Promise.reject(new Error('الرجاء إدخال بريد إلكتروني صحيح (مثال: example@gmail.com)'))
                        }
                        return Promise.resolve()
                    }
                }
            ]}
            hasFeedback
        >
            <Input
                prefix={<MailOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="example@gmail.com"
                style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }}
            />
        </Form.Item>
    )
}
