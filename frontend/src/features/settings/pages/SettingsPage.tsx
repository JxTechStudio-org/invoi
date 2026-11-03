import { useState } from 'react'
import { Card, Descriptions, Form, Input, Spin, theme } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import PageHeader from '../../shared/components/PageHeader'
import MainAlert from '../../shared/components/MainAlert'
import MainButton from '../../shared/components/MainButton'
import { currentUserApi } from '../../auth/api/currentUserApi'
import type { CurrentUser, ProfileUpdate } from '../../auth/api/currentUserApi'
import { useCurrentUser } from '../../auth/hooks/useCurrentUser'
import { getErrorMessage } from '../../../errors/errorMassages'
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError'

interface SettingsFormValues {
    businessName: string
    businessNameEn?: string
    reviewAmountThreshold?: string
}

// Same rules as the backend UpdateProfileDto.
const AMOUNT_PATTERN = /^\d{1,10}(?:\.\d{1,2})?$/
const NO_OUTER_SPACES = /^[^\s].*[^\s]$|^[^\s]$/

function toFormValues(user: CurrentUser): SettingsFormValues {
    return {
        businessName: user.businessName,
        businessNameEn: user.businessNameEn ?? '',
        reviewAmountThreshold: user.reviewAmountThreshold ?? ''
    }
}

/** Only the changed settings; an emptied optional field is sent as null (clears it). */
function buildUpdate(user: CurrentUser, values: SettingsFormValues): ProfileUpdate {
    const changes: ProfileUpdate = {}
    const businessName = values.businessName.trim()
    if (businessName !== user.businessName) changes.businessName = businessName

    const businessNameEn = values.businessNameEn?.trim() || null
    if (businessNameEn !== (user.businessNameEn ?? null)) changes.businessNameEn = businessNameEn

    const threshold = values.reviewAmountThreshold?.trim() || null
    const before = user.reviewAmountThreshold ?? null
    const sameAmount = threshold !== null && before !== null && Number(threshold) === Number(before)
    if (threshold !== before && !sameAmount) changes.reviewAmountThreshold = threshold
    return changes
}

export default function SettingsPage() {
    const { token } = theme.useToken()
    const queryClient = useQueryClient()
    const { data: user, isLoading, error } = useCurrentUser()
    const [form] = Form.useForm<SettingsFormValues>()
    const [isSaving, setIsSaving] = useState(false)
    const [alerts, setAlerts] = useState<Array<{ id: number; message: string; type: 'error' | 'success' | 'info' }>>([])

    const pushAlert = (message: string, type: 'error' | 'success' | 'info') =>
        setAlerts((prev) => [...prev, { id: Date.now() + prev.length, message, type }])

    const handleSave = async (values: SettingsFormValues) => {
        if (!user) return
        const changes = buildUpdate(user, values)
        if (!Object.keys(changes).length) {
            pushAlert('لا توجد تغييرات لحفظها.', 'info')
            return
        }
        setIsSaving(true)
        try {
            const { data } = await currentUserApi.update(changes)
            const { recheckedInvoices, ...profile } = data
            queryClient.setQueryData(['current-user'], profile)
            pushAlert('تم حفظ الإعدادات.', 'success')
            if (recheckedInvoices > 0) {
                // Review flags of open invoices changed: refresh lists and the dashboard.
                queryClient.invalidateQueries({ queryKey: ['invoices'] })
                pushAlert(`تغيّرت ملاحظات المراجعة في ${recheckedInvoices} فاتورة وفق الإعدادات الجديدة.`, 'info')
            }
        } catch (saveError) {
            pushAlert(getErrorMessage(mapAxiosErrorToCode(saveError)), 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const sectionTitle = (text: string) => (
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
            {text}
        </h3>
    )

    return (
        <div>
            <PageHeader pageIcon={<SettingOutlined />} pagename1='الإعدادات' page1path='' />

            <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
                {alerts.map((alert) => (
                    <MainAlert
                        key={alert.id}
                        alertMessage={alert.message}
                        alertType={alert.type}
                        closeAction={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                    />
                ))}

                {isLoading && <Spin />}
                {error && <MainAlert alertMessage={getErrorMessage(mapAxiosErrorToCode(error))} alertType="error" />}

                {user && (
                    <>
                        <div className="mb-6">
                            {sectionTitle('بيانات المنشأة والمراجعة')}
                            <Card>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    initialValues={toFormValues(user)}
                                    onFinish={handleSave}
                                    requiredMark={false}
                                >
                                    <Form.Item
                                        name="businessName"
                                        label="اسم المنشأة"
                                        extra="يُقارن باسم العميل في كل فاتورة."
                                        rules={[
                                            { required: true, whitespace: true, message: 'اسم المنشأة مطلوب' },
                                            { min: 3, message: 'اسم المنشأة 3 أحرف على الأقل' },
                                            { pattern: NO_OUTER_SPACES, message: 'لا يبدأ الاسم أو ينتهي بمسافة' }
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        name="businessNameEn"
                                        label="اسم المنشأة بالإنجليزية (اختياري)"
                                        extra="إذا كانت فواتيرك تحمل اسم منشأتك بالإنجليزية، أضفه هنا حتى لا تُعلَّم بعدم تطابق اسم العميل."
                                        rules={[
                                            { min: 3, message: 'الاسم 3 أحرف على الأقل' },
                                            { pattern: NO_OUTER_SPACES, message: 'لا يبدأ الاسم أو ينتهي بمسافة' }
                                        ]}
                                    >
                                        <Input dir="ltr" placeholder="Example Trading Co." />
                                    </Form.Item>
                                    <Form.Item
                                        name="reviewAmountThreshold"
                                        label="حد المبلغ للمراجعة (اختياري)"
                                        extra="الفواتير التي يتجاوز إجماليها أو ضريبتها هذا المبلغ تُحوَّل للمراجعة. اتركه فارغًا لإيقاف هذا الفحص."
                                        rules={[{ pattern: AMOUNT_PATTERN, message: 'أدخل مبلغًا صحيحًا (رقم موجب بحد أقصى خانتين عشريتين)' }]}
                                    >
                                        <Input dir="ltr" inputMode="decimal" placeholder="10000" />
                                    </Form.Item>
                                    <p style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 0 }}>
                                        عند تغيير هذه الإعدادات يُعاد فحص الفواتير التي تحتاج مراجعة. الملاحظات التي أضفتها بنفسك (مثل الإبلاغ عن خطأ) تبقى كما هي.
                                    </p>
                                    <MainButton type="primary" htmlType="submit" text="حفظ الإعدادات" loading={isSaving} />
                                </Form>
                            </Card>
                        </div>

                        <div className="mb-6">
                            {sectionTitle('بيانات الحساب')}
                            <Card>
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="الاسم">{`${user.firstName} ${user.lastName}`}</Descriptions.Item>
                                    <Descriptions.Item label="اسم المستخدم">{user.username}</Descriptions.Item>
                                    <Descriptions.Item label="البريد الإلكتروني">{user.email}</Descriptions.Item>
                                    <Descriptions.Item label="رقم الجوال"><span dir="ltr">{user.phone}</span></Descriptions.Item>
                                </Descriptions>
                                <p style={{ fontSize: 12, color: token.colorTextSecondary, margin: 0 }}>
                                    تعديل بيانات الحساب سيتوفر قريبًا. لتصحيح أي منها الآن تواصل معنا.
                                </p>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
