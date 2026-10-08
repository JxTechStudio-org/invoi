import { useTranslation } from 'react-i18next';

export const useAppTranslation = (ns?: string, keyPrefix?: string) => {
    const { t, i18n } = useTranslation(ns, { keyPrefix });
    const isRtl = i18n.language === 'ar';

    return { t, i18n, isRtl };
};