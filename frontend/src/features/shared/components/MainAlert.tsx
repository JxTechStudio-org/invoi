import { useEffect, useState } from 'react';
import { Alert, theme } from 'antd';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface MainAlertProps {
    alertMessage: string
    alertType?: AlertType
    closeAction?: () => void
    duration?: number
}

export default function MainAlert({
    alertMessage,
    alertType = 'info',
    closeAction,
    duration = 3000,
}: MainAlertProps) {
    const [visible, setVisible] = useState(true);
    const { token } = theme.useToken();

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

    const ALERT_COLORS: Record<AlertType, { bg: string; border: string }> = {
        success: { bg: token.colorSuccessBg, border: token.colorSuccess },
        info: { bg: token.colorInfoBg, border: token.colorInfo },
        warning: { bg: token.colorWarningBg, border: token.colorWarning },
        error: { bg: token.colorErrorBg, border: token.colorError },
    };

    const colors = ALERT_COLORS[alertType];

    return (
        <Alert
            title={alertMessage}
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
                boxShadow: token.boxShadowSecondary,
                borderRadius: token.borderRadiusLG,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
            }}
        />
    );
}
