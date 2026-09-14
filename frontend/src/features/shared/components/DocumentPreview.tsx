import { Flex, Button, Image } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined, RotateLeftOutlined, RotateRightOutlined } from '@ant-design/icons'

interface DocumentPreviewProps {
    src: string
    alt?: string
}

export default function DocumentPreview({ src, alt = 'مستند الفاتورة' }: DocumentPreviewProps) {
    return (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <Image
                src={src}
                alt={alt}
                preview={{
                    toolbarRender: (
                        _,
                        {
                            actions: { onZoomIn, onZoomOut, onRotateLeft, onRotateRight }
                        }
                    ) => (
                        <Flex gap={12} style={{ padding: 8 }}>
                            <Button
                                type="text"
                                icon={<ZoomInOutlined style={{ color: '#fff' }} />}
                                onClick={onZoomIn}
                            />
                            <Button
                                type="text"
                                icon={<ZoomOutOutlined style={{ color: '#fff' }} />}
                                onClick={onZoomOut}
                            />
                            <Button
                                type="text"
                                icon={<RotateLeftOutlined style={{ color: '#fff' }} />}
                                onClick={onRotateLeft}
                            />
                            <Button
                                type="text"
                                icon={<RotateRightOutlined style={{ color: '#fff' }} />}
                                onClick={onRotateRight}
                            />
                        </Flex>
                    )
                }}
            />
        </div>
    )
}
