import { Form, Input, theme } from 'antd'
import { PhoneOutlined } from '@ant-design/icons'

export default function PhoneField() {
    const { token } = theme.useToken()

    return (
        <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>رقم الهاتف</span>}
            name="phone"
            initialValue="+966"
            validateTrigger="onChange"
            hasFeedback
            rules={[
                { required: true, message: 'الرجاء إدخال رقم الهاتف' },
                {
                    validator: (_, value) => {
                        if (value && /[^\d+]/.test(value)) {
                            return Promise.reject(new Error('يجب إدخال أرقام فقط'))
                        }
                        if (!value || value === '+966') return Promise.resolve()
                        if (!value.startsWith('+9665')) {
                            return Promise.reject(new Error('يجب أن يبدأ الرقم بـ 5 بعد الرمز الدولي'))
                        }
                        if (value.length !== 13) {
                            return Promise.reject(new Error('يجب أن يتكون رقم الهاتف من 9 خانات بعد الرمز الدولي'))
                        }
                        return Promise.resolve()
                    }
                }
            ]}
            normalize={(value) => {
                if (/[^\d+]/.test(value)) return value.substring(0, 14)
                let num = value.replace(/\D/g, '')
                if (!num) return '+966'
                if (num.startsWith('966')) num = num.substring(3)
                while (num.startsWith('0')) num = num.substring(1)
                return '+966' + num.substring(0, 9)
            }}
        >
            <Input
                prefix={<PhoneOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="555555555"
                inputMode="numeric"
                maxLength={14}
                style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }}
                onKeyDown={(e) => {
                    if (e.key === 'Backspace' && e.currentTarget.value.length <= 4) {
                        e.preventDefault()
                    }
                }}
            />
        </Form.Item>
    )
}
