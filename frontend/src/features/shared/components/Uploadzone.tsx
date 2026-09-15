
  import { CloudUploadOutlined, FileTextOutlined, CheckCircleFilled, CloseOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Upload, Progress, theme } from 'antd'
import { useState } from 'react'
import { fileTypeFromBuffer } from 'file-type'

const { Dragger } = Upload

interface UploadzoneProps {
    accept?: string
    maxSizeMB: number
    multiple?: boolean
    onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>
    onFileRejected?: (message: string) => void
}

export default function Uploadzone({
    accept = '.pdf,.png,.jpg,.jpeg',
    maxSizeMB,
    multiple = true,
    onUpload,
    onFileRejected
}: UploadzoneProps) {
    const { token } = theme.useToken()
    const [progressMap, setProgressMap] = useState<Record<string, number>>({})

    const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
        const isWithinSize = file.size / 1024 / 1024 <= maxSizeMB
        if (!isWithinSize) {
            onFileRejected?.(`${file.name} يتجاوز الحجم المسموح (${maxSizeMB}MB).`)
            return Upload.LIST_IGNORE
        }

        const buffer = await file.arrayBuffer()
        const type = await fileTypeFromBuffer(new Uint8Array(buffer))

        const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
        if (!type || !allowedMimeTypes.includes(type.mime)) {
            onFileRejected?.(`${file.name} محتوى الملف غير مطابق للصيغة المسموحة.`)
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
            removeIcon: <CloseOutlined style={{ color: token.colorTextTertiary, fontSize: 12, transition: 'color 0.2s' }} />,
            showDownloadIcon: false
        },
        itemRender: (_, file) => (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    marginTop: 12,
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 12,
                    boxShadow: token.boxShadowTertiary,
                    transition: 'all 0.2s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', flex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: token.colorPrimaryBg,
                            flexShrink: 0
                        }}
                    >
                        <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                        <span
                            style={{
                                fontSize: 13,
                                color: token.colorText,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 240
                            }}
                        >
                            {file.name}
                        </span>
                        <span style={{ fontSize: 11, color: token.colorTextSecondary }}>
                            {(file.size ? (file.size / 1024 / 1024).toFixed(2) : '0')} MB
                        </span>
                        {progressMap[file.name] !== undefined && progressMap[file.name] < 100 && (
                            <Progress percent={progressMap[file.name]} size="small" status="active" showInfo={false} />
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {file.status === 'done' && <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 16 }} />}
                    {file.status === 'uploading' && (
                        <span style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>جاري الرفع...</span>
                    )}
                </div>
            </div>
        ),
        customRequest: async ({ file, onSuccess, onError }) => {
            const fileObj = file as File
            try {
                await onUpload(fileObj, (percent) => {
                    setProgressMap((prev) => ({ ...prev, [fileObj.name]: percent }))
                })
                onSuccess?.('ok')
            } catch (error) {
                onError?.(error as Error)
            }
        }
    }

    return (
        <Dragger {...props}>
            <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ color: token.colorPrimary }} />
            </p>
            <p className="ant-upload-text">اسحبي الملف هنا أو اضغطي للرفع</p>
            <p className="ant-upload-hint">
                الحد الأقصى {maxSizeMB}MB لكل ملف — الصيغ المدعومة: PDF, PNG, JPG
            </p>
        </Dragger>
    )
}

