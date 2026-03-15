import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { Stats } from "@/components/marketing/stats";
import { Pricing } from "@/components/marketing/pricing";
import { CtaSection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <Features />
      <Pricing />
      <CtaSection />
    </main>
  );
}
