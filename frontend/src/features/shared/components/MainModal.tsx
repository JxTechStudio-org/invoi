import type { ReactNode } from 'react'
import { useState } from 'react'
import { Modal, theme } from 'antd'
import MainButton from './MainButton'

interface MainModalProps {
    triggerText?: string
    triggerIcon?: ReactNode
    title: string
    children: ReactNode
    onConfirm: () => void
    okText?: string
    cancelText?: string
    confirmLoading?: boolean
    danger?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function MainModal({
    triggerText,
    triggerIcon,
    title,
    children,
    onConfirm,
    okText = 'تأكيد',
    cancelText = 'إلغاء',
    confirmLoading = false,
    danger = false,
    open,
    onOpenChange
}: MainModalProps) {
    const { token } = theme.useToken()
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen

    const setOpen = (value: boolean) => {
        if (isControlled) {
            onOpenChange?.(value)
        } else {
            setInternalOpen(value)
        }
    }

    const handleConfirm = () => {
        onConfirm()
        setOpen(false)
    }

    return (
        <>
            {triggerText && <MainButton text={triggerText} icon={triggerIcon} onClick={() => setOpen(true)} />}

            <Modal
                title={
                    <div>
                        <span>{title}</span>
                        <div 
                            style={{ 
                                height: '1px', 
                                backgroundColor: token.colorBorderSecondary, 
                                marginTop: '16px', 
                                marginInline: '-28px' 
                            }} 
                        />
                    </div>
                }
                open={isOpen}
                onCancel={() => setOpen(false)}
                centered
                destroyOnClose
                width={480}
                styles={{
                    mask: {
                        backdropFilter: 'blur(6px)',
                        background: 'rgba(15, 23, 42, 0.45)'
                    },
                    header: {
                        padding: '24px 28px 0',
                        margin: 0,
                        borderBottom: 'none'
                    },
                    title: {
                        fontSize: 18,
                        fontWeight: 600,
                        color: token.colorText
                    },
                    body: {
                        padding: '28px 28px 36px',
                        fontSize: 15,
                        color: token.colorTextSecondary
                    },
                    footer: {
                        padding: 0,
                        borderTop: 'none',
                        background: 'transparent'
                    }
                }}
                style={{ borderRadius: '24px', overflow: 'hidden' }}
                footer={[
                    <div 
                        key='modal-footer' 
                        style={{ 
                            marginInline: -28, 
                            marginBottom: -24, 
                            marginTop: '8px',
                            padding: '16px 28px', 
                            borderTop: `1px solid ${token.colorBorderSecondary}`,
                            borderBottomLeftRadius: '24px', 
                            borderBottomRightRadius: '24px', 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: 12 
                        }}
                    >
                        <MainButton 
                            key="cancel" 
                            text={cancelText} 
                            type="default" 
                            onClick={() => setOpen(false)} 
                            style={{ minWidth: '100px' }} 
                        />
                        <MainButton
                            key="ok"
                            text={okText}
                            type="primary"
                            danger={danger}
                            loading={confirmLoading}
                            onClick={handleConfirm}
                            style={{ minWidth: '100px' }}
                        />
                    </div>
                ]}
            >
                {children}
            </Modal>
        </>
    )
}
