import { Hero } from './features/landing/components/hero';
import HowItWorks from './features/landing/components/HowItWorks';
import Features from './features/landing/components/Features';
import TargetUsers from './features/landing/components/TargetUsers';
import { Footer } from './features/landing/components/Footer';
import './App.css';
import { Header } from './features/landing/components/Header';
import { FAQ } from './features/landing/components/FAQ';
import { SupportedFiles } from './features/landing/components/SupportedFiles';
import { CtaBanner } from './features/landing/components/CtaBanner';


function App() {
  return (
    <>
      <Header />
      <Hero />
      <TargetUsers />
      <SupportedFiles />
      <Features />
      <HowItWorks />
      <FAQ />
      <CtaBanner />
      <Footer />

    </>
  );
}

export default App;
