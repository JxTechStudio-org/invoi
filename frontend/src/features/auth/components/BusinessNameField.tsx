import { Form, Input, theme } from 'antd'

export default function BusinessNameField({ isMobile }: { isMobile: boolean }) {
    const { token } = theme.useToken()

    return (
        <Form.Item
            label={<span style={{ fontWeight: 500, color: token.colorTextSecondary }}>اسم المنشأة</span>}
            style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}
            validateTrigger="onChange"
            rules={[
                { required: true, message: 'الرجاء إدخال اسم المنشأة' },
                {
                    validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        if (value.length < 3) {
                            return Promise.reject(new Error('يجب أن يتكون اسم المنشأة من 3 خانات على الأقل'))
                        }
                        if (value.startsWith(' ') || value.endsWith(' ')) {
                            return Promise.reject(new Error('يجب ألا يبدأ أو ينتهي الاسم بمسافة'))
                        }
                        return Promise.resolve()
                    }
                }
            ]}
            hasFeedback
        >
            <Input placeholder="مثال: مؤسسة المانع  " style={{ height: 42, borderRadius: 10, backgroundColor: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} />
        </Form.Item>
    )
}
