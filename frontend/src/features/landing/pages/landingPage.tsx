import React, { useEffect } from 'react'
import { ConfigProvider } from 'antd';
import { MotionConfig } from 'framer-motion';
import { useLandingTheme } from '../hooks/useLandingTheme';
import { Hero } from '../components/hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import VerificationFeatures from '../components/VerificationFeatures';
import TargetUsers from '../components/TargetUsers';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { FAQ } from '../components/FAQ';
import { SupportedFiles } from '../components/SupportedFiles';
import { CTABanner } from '../components/CTABanner';

export default function LandingPage() {
    useLandingTheme();

    // Links like /#faq from other pages load this page first; scroll once the sections exist.
    useEffect(() => {
        const id = window.location.hash.slice(1);
        if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    }, []);

    return (
        <ConfigProvider direction="rtl">
            <MotionConfig reducedMotion="user">
                <Header />
                <div className='landing-gradient-bg' style={{ minHeight: '100vh', width: '100%' }}>
                    <Hero />
                    <TargetUsers />
                    <SupportedFiles />
                    <Features />
                    <VerificationFeatures />
                    <HowItWorks />
                    <FAQ />
                    <CTABanner />
                </div>
                <Footer />
            </MotionConfig>
        </ConfigProvider>

    )
}
