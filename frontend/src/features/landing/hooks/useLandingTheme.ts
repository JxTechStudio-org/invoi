import { useEffect } from 'react';

/**
 * Marks <html> while a public page (landing, privacy) is mounted so the dark-mode CSS
 * variables in index.css apply to it, including antd portals such as the mobile Drawer.
 */
export function useLandingTheme() {
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('landing');
        return () => root.classList.remove('landing');
    }, []);
}
