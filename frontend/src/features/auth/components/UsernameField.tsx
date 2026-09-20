import { Form, Input, theme } from 'antd'
import { UserOutlined } from '@ant-design/icons'

export default function UsernameField() {
    const { token } = theme.useToken()

    return (
        <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>اسم المستخدم (بالإنجليزية)</span>}
            name="username"
            validateTrigger="onChange"
            rules={[
                { required: true, message: 'الرجاء إدخال اسم المستخدم' },
                { pattern: /^[A-Za-z0-9_]+$/, message: 'يجب إدخال أحرف إنجليزية أو أرقام أو شرطة سفلية فقط' },
                {
                    validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        if (value.length < 3) {
                            return Promise.reject(new Error('يجب أن يتكون اسم المستخدم من 3 خانات على الأقل'))
                        }
                        return Promise.resolve()
                    }
                }
            ]}
            hasFeedback
        >
            <Input prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />} placeholder="ahmad_alotaibi" style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
        </Form.Item>
    )
}
