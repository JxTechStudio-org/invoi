import { Form, Input, theme } from 'antd'
import { LockOutlined } from '@ant-design/icons'

export default function ConfirmPasswordField() {
    const { token } = theme.useToken()

    return (
        <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>تأكيد كلمة المرور</span>}
            name="confirm_password"
            dependencies={['password']}
            validateTrigger="onChange"
            rules={[
                { required: true, message: 'الرجاء تأكيد كلمة المرور' },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                        }
                        return Promise.reject(new Error('كلمتا المرور غير متطابقتين'))
                    }
                })
            ]}
            hasFeedback
        >
            <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="إعادة إدخال كلمة المرور"
                style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }}
            />
        </Form.Item>
    )
}
