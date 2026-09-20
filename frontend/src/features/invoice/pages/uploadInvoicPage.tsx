import { Typography, Space } from 'antd'
import Uploadzone from '../../shared/components/Uploadzone'
import MainAlert from '../../shared/components/MainAlert'
import PageHeader from '../../shared/components/PageHeader'
import { LiaFileInvoiceDollarSolid } from "react-icons/lia"
import { useAlert } from '../../shared/hooks/useAlert'
import { useUploadInvoice } from '../hooks/useUploadInvoice'

const { Title, Text } = Typography
const MAX_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB) || 10

export default function UploadInvoicePage() {
    const { alerts, showAlert, removeAlert } = useAlert()
    const { upload, errorMessage } = useUploadInvoice()

    const handleUpload = async (file: File, onProgress: (percent: number) => void) => {
        try {
            const result = await upload(file)
            showAlert(`تم استلام الفاتورة بنجاح — رقم الفاتورة: ${result.invoice_id}`, 'success')
        } catch {
            showAlert(errorMessage || 'حدث خطأ غير متوقع.', 'error')
            throw new Error('Upload failed')
        }
    }

    return (
        <>
            <PageHeader pageIcon={<LiaFileInvoiceDollarSolid />} pagename1='الفواتير' pagename2="اضافه فاتورة " page1path='/invoices'/>
            <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
            {alerts.map((alert) => (
                <MainAlert key={alert.id} alertMessage={alert.message} alertType={alert.type} closeAction={() => removeAlert(alert.id)} />
            ))}

            <Space direction="vertical" size={4} style={{ marginBottom: 20, width: '100%' }}>
                <Title level={4} style={{ margin: 0 }}>رفع فاتورة جديدة</Title>
                <Text type="secondary">قومي برفع فاتورة أو إيصال بصيغة PDF أو صورة لبدء عملية الاستخراج التلقائي</Text>
            </Space>

            <Uploadzone maxSizeMB={MAX_SIZE_MB} onUpload={handleUpload} onFileRejected={(message) => showAlert(message, 'error')} />
        </div>
        </>
    )
}
