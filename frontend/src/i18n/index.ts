import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import arAnalytics from "./locales/ar/analytics.json";
import arAuth from "./locales/ar/auth.json";
import arDashboard from "./locales/ar/dashboard.json";
import arInvoice from "./locales/ar/invoice.json";
import arLanding from "./locales/ar/landing.json";
import arShared from "./locales/ar/shared.json";
import arVendors from "./locales/ar/vendors.json";

import enAnalytics from "./locales/en/analytics.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enInvoice from "./locales/en/invoice.json";
import enLanding from "./locales/en/landing.json";
import enShared from "./locales/en/shared.json";
import enVendors from "./locales/en/vendors.json";

i18n.use(initReactI18next).init({
    resources: {
        ar: {
            analytics: arAnalytics, auth: arAuth, dashboard: arDashboard,
            invoice: arInvoice, landing: arLanding, shared: arShared, vendors: arVendors,
        },
        en: {
            analytics: enAnalytics, auth: enAuth, dashboard: enDashboard,
            invoice: enInvoice, landing: enLanding, shared: enShared, vendors: enVendors,
        },
    },
    defaultNS: "shared",
    lng: localStorage.getItem("lang") || "ar",
    fallbackLng: "ar",
    interpolation: { escapeValue: false },
});

// يضبط الاتجاه واللغة تلقائياً عند أي تغيير (بدون كود في المكوّنات)
const applyLang = (lng: string) => {
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lng);
};
applyLang(i18n.language);
i18n.on("languageChanged", applyLang);

export default i18n;