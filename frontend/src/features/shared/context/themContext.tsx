import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ConfigProvider } from 'antd'
import { buildTheme } from '../../../config/theme/theme'

interface ThemeContextType {
    mode: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        const savedMode = localStorage.getItem('theme_mode');
        const initial = (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
        document.documentElement.dataset.theme = initial; // before first paint, no light flash
        return initial;
    });
    useEffect(() => {
        localStorage.setItem('theme_mode', mode);
        // Lets CSS variables follow the antd theme (used by the public pages, see index.css).
        document.documentElement.dataset.theme = mode;
    }, [mode]);

    // The colour fade overrides every element's own transition, so it is only
    // added while the theme switches (otherwise hover/transform animations jump).
    const toggleTheme = () => {
        const styleId = 'smooth-theme-transition';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            styleTag.innerHTML = `
                *, *::before, *::after {
                    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease !important;
                }
            `;
            document.head.appendChild(styleTag);
        }
        window.setTimeout(() => styleTag?.remove(), 400);
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const currentTheme = useMemo(() => buildTheme(mode), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <ConfigProvider theme={currentTheme}>
                {children}
            </ConfigProvider>
        </ThemeContext.Provider>
    );
}


export function useThemeMode() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within an AppThemeProvider')
    }
    return context;
}
