import { DownloadOutlined } from '@ant-design/icons'
import MainButton from './MainButton'

interface ExportButtonProps {
    onClick: () => void
    loading?: boolean
    text?: string
}

export default function ExportButton({ onClick, loading = false, text = 'تصدير CSV' }: ExportButtonProps) {
    return (
        <MainButton
            text={text}
            type="default"
            icon={<DownloadOutlined />}
            onClick={onClick}
            loading={loading}
        />
    )
}
