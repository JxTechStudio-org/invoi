import { useEffect, useState } from 'react';
import { Alert } from 'antd';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface MainAlertProps {
    alertMessage: string
    alertType?: AlertType
    closeAction?: () => void
    duration?: number
}

const ALERT_COLORS: Record<AlertType, { bg: string; border: string }> = {
    success: { bg: '#F6FFED', border: '#10B981' },
    info: { bg: '#E6F4FF', border: '#3B82F6' },
    warning: { bg: '#FFFBE6', border: '#F59E0B' },
    error: { bg: '#FFF1F0', border: '#EF4444' },
};

export default function MainAlert({
    alertMessage,
    alertType = 'info',
    closeAction,
    duration = 3000,
}: MainAlertProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false)
            closeAction?.()
        }, duration);
        return () => clearTimeout(timer);
    }, [alertMessage, closeAction, duration]);

    if (!visible) return null

    const handleClose = () => {
        setVisible(false);
        closeAction?.()
    };

    const colors = ALERT_COLORS[alertType];

    return (
        <Alert
            message={alertMessage}
            type={alertType}
            onClose={handleClose}
            showIcon
            closable
            style={{
                position: 'fixed',
                top: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                width: 'calc(100% - 40px)',
                maxWidth: 500,
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                borderRadius: 12,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
            }}
        />
    );
}
