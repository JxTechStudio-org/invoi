import { useState } from 'react'
import { Typography, Space, Card, Row, Col, theme } from 'antd'
import Uploadzone from '../../shared/components/Uploadzone'
import MainAlert from '../../shared/components/MainAlert'
import PageHeader from '../../shared/components/PageHeader'
import ProcessSteps from '../../shared/components/ProcessSteps'
import { LiaFileInvoiceDollarSolid } from "react-icons/lia"
import { FiInfo, FiClock, FiFileText } from "react-icons/fi"
import { useAlert } from '../../shared/hooks/useAlert'
import { useUploadInvoice } from '../hooks/useUploadInvoice'
import InfoFeatureItem from '../components/InfoFeatureItem'

const { Title, Text } = Typography
const MAX_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB) || 10

const UPLOAD_STEPS = [
    { title: 'اختيار الملف' },
    { title: 'جاري الرفع' },
    { title: 'تم الاستلام' }
]

export default function UploadInvoicePage() {
    const { alerts, showAlert, removeAlert } = useAlert()
    const { upload, errorMessage } = useUploadInvoice()
    const [currentStep, setCurrentStep] = useState(0)
    const { token } = theme.useToken()

    const handleUpload = async (file: File, onProgress: (percent: number) => void) => {
        setCurrentStep(1)
        try {
            const result = await upload(file)
            setCurrentStep(2)
            showAlert(`تم استلام الفاتورة بنجاح وهي الآن قيد المعالجة — رقم الفاتورة: ${result.invoice_id}`, 'success')
        } catch {
            setCurrentStep(0)
            showAlert(errorMessage || 'حدث خطأ أثناء رفع الفاتورة. تأكد من نوع الملف وحجمه وحاول مرة أخرى.', 'error')
            throw new Error('Upload failed')
        }
    }

    return (
        <>
            <PageHeader pageIcon={<LiaFileInvoiceDollarSolid />} pagename1='الفواتير' pagename2="إضافة فاتورة" page1path='' />

            <div style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>
                {alerts.map((alert) => (
                    <MainAlert key={alert.id} alertMessage={alert.message} alertType={alert.type} closeAction={() => removeAlert(alert.id)} />
                ))}

                <Row gutter={24} justify="center" align="middle">
                    <Col xs={24} lg={22}>
                        <Card
                            bordered={false}
                            style={{
                                boxShadow: token.boxShadowTertiary || '0 10px 30px rgba(0, 0, 0, 0.04)',
                                marginBottom: 24,
                                backgroundColor: token.colorBgContainer,
                                borderRadius: token.borderRadiusLG,
                                border: `1px solid ${token.colorBorderSecondary}`
                            }}
                        >
                            <Space direction="vertical" size={8} style={{ marginBottom: 24, width: '100%', textAlign: 'center' }}>
                                <Title level={4} style={{ margin: 0, color: token.colorTextHeading, fontWeight: 600 }}>رفع فاتورة جديدة</Title>
                                <Text type="secondary">قم برفع فاتورة أو إيصال بصيغة PDF أو صورة لبدء إرسالها للنظام بمعايير آمنة</Text>
                            </Space>

                            <div style={{ marginBottom: 36, padding: '0 12px' }}>
                                <ProcessSteps items={UPLOAD_STEPS} current={currentStep} />
                            </div>

                            <div style={{ paddingBottom: 8 }}>
                                <Uploadzone maxSizeMB={MAX_SIZE_MB} onUpload={handleUpload} onFileRejected={(message) => showAlert(message, 'error')} />
                            </div>
                        </Card>
                        <Card
                            bordered={false}
                            style={{
                                backgroundColor: token.colorBgContainer,
                                borderRadius: token.borderRadiusLG,
                                boxShadow: token.boxShadowTertiary || '0 4px 16px rgba(0, 0, 0, 0.02)',
                                border: `1px solid ${token.colorBorderSecondary}`
                            }}
                        >
                            <Row gutter={[20, 16]} align="middle">
                                <Col xs={24} md={8}>
                                    <InfoFeatureItem
                                        icon={<FiFileText size={22} />}
                                        iconBgColor={token.colorPrimaryBg}
                                        iconColor={token.colorPrimary}
                                        title="المتابعة المباشرة"
                                        description="راجع الفواتير المرفوعة مباشرة من القائمة."
                                        token={token}
                                    />
                                </Col>

                                <Col xs={24} md={8}>
                                    <InfoFeatureItem
                                        icon={<FiClock size={22} />}
                                        iconBgColor={token.colorInfoBg}
                                        iconColor={token.colorInfo}
                                        title="المعالجة الفورية"
                                        description="يرسل الملف للخادم فور اكتمال عملية الرفع."
                                        token={token}
                                    />
                                </Col>

                                <Col xs={24} md={8}>
                                    <InfoFeatureItem
                                        icon={<FiInfo size={22} />}
                                        iconBgColor={token.colorWarningBg}
                                        iconColor={token.colorWarning}
                                        title="تأكيد الرفع"
                                        description="يظهر رقم الفاتورة فور نجاح الاستلام."
                                        token={token}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    )
}
