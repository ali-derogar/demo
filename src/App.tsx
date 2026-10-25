import { useEffect } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { useSmoothScroll } from './lib/useSmoothScroll';
import { Backdrop } from './components/Backdrop';
import { Preloader } from './components/Preloader';
import { ScrollChrome } from './components/ScrollChrome';
import { CustomCursor } from './components/CustomCursor';
import { SiteHeader } from './components/SiteHeader';
import { HeroSection } from './components/HeroSection';
import { Marquee } from './components/Marquee';
import { Capabilities } from './components/Capabilities';
import { DemoGallery } from './components/DemoGallery';
import { StatsBand } from './components/StatsBand';
import { ProfileSection } from './components/ProfileSection';
import { ContactSection } from './components/ContactSection';
import { SiteFooter } from './components/SiteFooter';
import { MobileDock } from './components/MobileDock';
import { techMarquee } from './data/profile';

export default function App() {
  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
  }, []);
  useSmoothScroll();

  return (
    <LazyMotion features={domAnimation} strict>
      <Preloader />
      <Backdrop />
      <ScrollChrome />
      <CustomCursor />
      <a className="skip-link" href="#demos">
        پرش به نمونهکارها
      </a>
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <Marquee items={techMarquee} label="فناوری‌هایی که با آن‌ها کار می‌کنم" />
        <Capabilities />
        <DemoGallery />
        <StatsBand />
        <ProfileSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <MobileDock />
    </LazyMotion>
  );
}
