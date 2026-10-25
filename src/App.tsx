import { useEffect } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { useSmoothScroll } from './lib/useSmoothScroll';
import { AmbientBackground } from './components/AmbientBackground';
import { CustomCursor } from './components/CustomCursor';
import { SiteHeader } from './components/SiteHeader';
import { HeroSection } from './components/HeroSection';
import { Marquee } from './components/Marquee';
import { DemoGallery } from './components/DemoGallery';
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
      <AmbientBackground />
      <CustomCursor />
      <a className="skip-link" href="#demos">
        پرش به نمونهکارها
      </a>
      <SiteHeader />
      <main id="main">
        <HeroSection />
        <Marquee items={techMarquee} label="فناوری‌هایی که با آن‌ها کار می‌کنم" />
        <DemoGallery />
        <ProfileSection />
        <ContactSection />
      </main>
      <SiteFooter />
      <MobileDock />
    </LazyMotion>
  );
}
