import { CloudUploadOutlined, FileTextOutlined, CheckCircleFilled, CloseOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { Upload } from 'antd'
import MainAlert from './MainAlert'
import { useAlert } from '../hooks/useAlert'
import { fileTypeFromBuffer } from 'file-type'

const { Dragger } = Upload

interface UploadzoneProps {
    uploadUrl?: string
    accept?: string
    maxSizeMB?: number
    multiple?: boolean
    onUploadSuccess?: (file: UploadFile) => void
    onUploadError?: (file: UploadFile) => void
}

export default function Uploadzone({
    uploadUrl,
    accept = '.pdf,.png,.jpg,.jpeg',
    maxSizeMB = 10,
    multiple = true,
    onUploadSuccess,
    onUploadError,
}: UploadzoneProps) {
    const { alerts, showAlert, removeAlert } = useAlert()


    const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
        const isWithinSize = file.size / 1024 / 1024 <= maxSizeMB
        if (!isWithinSize) {
            showAlert(`${file.name} يتجاوز الحجم المسموح (${maxSizeMB}MB).`, 'warning')
            return Upload.LIST_IGNORE
        }

        const buffer = await file.arrayBuffer()
        const type = await fileTypeFromBuffer(new Uint8Array(buffer))

        const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
        if (!type || !allowedMimeTypes.includes(type.mime)) {
            showAlert(`${file.name} محتوى الملف غير مطابق للصيغة المسموحة.`, 'error')
            return Upload.LIST_IGNORE
        }

        return true
    }


    const props: UploadProps = {
        name: 'file',
        multiple,
        accept,
        beforeUpload,
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: <CloseOutlined style={{ color: '#94a3b8', fontSize: '12px', transition: 'color 0.2s' }} />,
            showDownloadIcon: false,
        },
        itemRender: (_, file) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', marginTop: '12px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: '#eef2ff' }}>
                        <FileTextOutlined style={{ color: '#10B981', fontSize: '18px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{file.name}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{(file.size ? (file.size / 1024 / 1024).toFixed(2) : '0')} MB</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {file.status === 'done' && <CheckCircleFilled style={{ color: '#84CC16', fontSize: '16px' }} />}
                    {file.status === 'uploading' && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>جاري الرفع...</span>}
                </div>
            </div>
        ),
        ...(uploadUrl
            ? { action: uploadUrl }
            : {
                customRequest: ({ onSuccess }) => {
                    setTimeout(() => {
                        onSuccess?.('ok')
                    }, 1000)
                },
            }),
        onChange(info) {
            const { status } = info.file
            if (status === 'done') {
                showAlert(`${info.file.name} تم الرفع بنجاح.`, 'success')
                onUploadSuccess?.(info.file)
            }
            if (status === 'error') {
                showAlert(`${info.file.name} فشل الرفع.`, 'error')
                onUploadError?.(info.file)
            }
        },
    }

    return (
        <>
            {alerts.map((alert) => (
                <MainAlert
                    key={alert.id}
                    alertMessage={alert.message}
                    alertType={alert.type}
                    closeAction={() => removeAlert(alert.id)}
                />
            ))}
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined />
                </p>
                <p className="ant-upload-text">اسحبي الملف هنا أو اضغطي للرفع</p>
                <p className="ant-upload-hint">
                    الحد الأقصى {maxSizeMB}MB لكل ملف — الصيغ المدعومة: PDF, PNG, JPG
                </p>
            </Dragger>
        </>
    )
}
