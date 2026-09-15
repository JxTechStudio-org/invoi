import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

type Mode = 'light' | 'dark';

export const buildTheme = (mode: Mode): ThemeConfig => {
    const isDark = mode === 'dark';

    return {
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            colorPrimary: '#10B981', 
            colorSuccess: '#84CC16', 
            colorWarning: '#F59E0B',
            colorError: '#EF4444',
            colorInfo: '#3B82F6',

            fontFamily: "'Inter', 'IBM Plex Sans Arabic', -apple-system, sans-serif",
            borderRadius: 8,
            controlHeight: 40,

            colorBgLayout: isDark ? '#0F172A' : '#F8FAFC',
            colorBgContainer: isDark ? '#1E293B' : '#FFFFFF',
            colorBorder: isDark ? '#334155' : '#E2E8F0', 
        },
        components: {
            Button: {
                borderRadius: 8,
                controlHeight: 40,
            },
            Tag: {
                borderRadiusSM: 9999,
            },
            Card: {
                borderRadiusLG: 12,
            },
        },
    };
};

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
