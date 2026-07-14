import NavbarWrapper from '@/components/layout/NavbarWrapper';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Clients from '@/components/sections/Clients';
import Qualifications from '@/components/sections/Qualifications';
import CEOProfile from '@/components/sections/CEOProfile';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <>
      <NavbarWrapper />
      <main>
        <Hero />
        <About />
        <Services />
        <Clients />
        <Qualifications />
        <CEOProfile />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
