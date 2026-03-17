import { Hero } from "@/components/marketing/hero";
import { UserTypes } from "@/components/marketing/user-types";
import { CtaSection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <main>
      <Hero />
      <UserTypes />
      <CtaSection />
    </main>
  );
}
