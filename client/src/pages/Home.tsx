import HeroSection from "@/components/home/HeroSection";
import PassportSection from "@/components/home/PassportSection";
import ServicesSection from "@/components/home/ServicesSection";
import PortfolioSection from "@/components/home/PortfolioSection";
import PricingSection from "@/components/home/PricingSection";
import AboutSection from "@/components/home/AboutSection";
import ContactSection from "@/components/home/ContactSection";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Service, Track } from "@shared/schema";

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  const { data: tracks, isLoading: isLoadingTracks } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
  });
  
  // Scroll to section if hash is present in URL
  useEffect(() => {
    if (!initialized && !isLoadingServices && !isLoadingTracks) {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
      setInitialized(true);
    }
  }, [initialized, isLoadingServices, isLoadingTracks]);
  
  const isLoading = isLoadingServices || isLoadingTracks;
  
  return (
    <>
      <HeroSection />
      <PassportSection />
      <ServicesSection services={services || []} isLoading={isLoading} />
      <PortfolioSection tracks={tracks || []} isLoading={isLoading} />
      <PricingSection services={services || []} isLoading={isLoading} />
      <AboutSection />
      <ContactSection />
    </>
  );
}
