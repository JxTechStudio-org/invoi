import { Hero } from './features/landing/components/hero';
import HowItWorks from './features/landing/components/HowItWorks';
import Features from './features/landing/components/Features';
import { Footer } from './features/landing/components/Footer';
import './App.css';

function App() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Footer/>

    </>
  );
}

export default App;
