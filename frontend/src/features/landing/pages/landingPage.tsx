import React from 'react'
import { Hero } from '../components/hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import TargetUsers from '../components/TargetUsers';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { FAQ } from '../components/FAQ';
import { SupportedFiles } from '../components/SupportedFiles';
import { CTABanner } from '../components/CTABanner';

export default function LandingPage() {
    return (
        <>
            <Header />
            <div className='landing-gradient-bg' style={{ minHeight: '100vh', width: '100%' }}>
                <Hero />
                <TargetUsers />
                <SupportedFiles />
                <Features />
                <HowItWorks />
                <FAQ />
                <CTABanner />
            </div>
            <Footer />
        </>

    )
}
