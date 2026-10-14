import { useEffect } from 'react';
import { SiteHeader } from './components/SiteHeader';
import { HeroSection } from './components/HeroSection';
import { DemoGallery } from './components/DemoGallery';
import { AboutSection } from './components/AboutSection';
import { SiteFooter } from './components/SiteFooter';
import { MobileDock } from './components/MobileDock';

export default function App() {
  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
  }, []);

  return (
    <>
      <a className="skip-link" href="#demos">
        پرش به نمونه‌کارها
      </a>
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <DemoGallery />
        <AboutSection />
      </main>
      <SiteFooter />
      <MobileDock />
    </>
  );
}
