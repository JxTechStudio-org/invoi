import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';

const { Dragger } = Upload;

type UploadzoneFile = NonNullable<UploadProps['fileList']>[number]

interface UploadzoneProps {
    uploadUrl: string
    accept?: string
    maxSizeMB?: number
    multiple?: boolean
    onUploadSuccess?: (file: UploadzoneFile) => void
    onUploadError?: (file: UploadzoneFile) => void
}

export default function Uploadzone({
    uploadUrl,
    accept = '.pdf,.png,.jpg,.jpeg',
    maxSizeMB = 10,
    multiple = true,
    onUploadSuccess,
    onUploadError,
}: UploadzoneProps) {
    const [messageApi, contextHolder] = message.useMessage();

    const beforeUpload: UploadProps['beforeUpload'] = (file) => {
        const isAllowedType = accept
            .split(',')
            .some((ext) => file.name.toLowerCase().endsWith(ext.trim()));
        if (!isAllowedType) {
            messageApi.error(`${file.name} نوع الملف غير مدعوم.`);
            return Upload.LIST_IGNORE
        }
        const isWithinSize = file.size / 1024 / 1024 <= maxSizeMB;
        if (!isWithinSize) {
            messageApi.error(`${file.name} يتجاوز الحجم المسموح (${maxSizeMB}MB).`);
            return Upload.LIST_IGNORE
        }
        return true;
    };

    const props: UploadProps = {
        name: 'file',
        multiple,
        action: uploadUrl,
        accept,
        beforeUpload,
        onChange(info) {
            const { status } = info.file
            if (status === 'done') {
                messageApi.success(`${info.file.name} تم الرفع بنجاح.`)
                onUploadSuccess?.(info.file)
            }
            if (status === 'error') {
                messageApi.error(`${info.file.name} فشل الرفع.`)
                onUploadError?.(info.file)
            }
        },
    };

    return (
        <>
            {contextHolder}
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">اسحبي الملف هنا أو اضغطي للرفع</p>
                <p className="ant-upload-hint">
                    الحد الأقصى {maxSizeMB}MB لكل ملف — الصيغ المدعومة: PDF, PNG, JPG
                </p>
            </Dragger>
        </>
    );
}
