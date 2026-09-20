import { Form, Input, theme } from 'antd'
import { LockOutlined } from '@ant-design/icons'

interface PasswordFieldProps {
    label?: string
    placeholder?: string
}

export default function PasswordField({ label = 'كلمة المرور', placeholder = 'Ex: Password@12' }: PasswordFieldProps) {
    const { token } = theme.useToken()

    return (
        <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>{label}</span>}
            name="password"
            validateTrigger="onChange"
            rules={[
                { required: true, message: 'الرجاء إدخال كلمة المرور' },
                {
                    validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        if (value.includes(' ')) {
                            return Promise.reject(new Error('يجب ألا تحتوي كلمة المرور على مسافات'))
                        }
                        if (value.length < 8) {
                            return Promise.reject(new Error('يجب أن تتكون كلمة المرور من 8 خانات على الأقل'))
                        }
                        const passwordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
                        if (!passwordRegex.test(value)) {
                            return Promise.reject(new Error('يجب أن تشمل كلمة المرور حرفًا صغيرًا وحرفًا كبيرًا ورقمًا ورمزًا خاصًا'))
                        }
                        return Promise.resolve()
                    }
                }
            ]}
            hasFeedback
        >
            <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder={placeholder}
                style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }}
            />
        </Form.Item>
    )
}
