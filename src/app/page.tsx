import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { UserTypes } from "@/components/marketing/user-types";
import { CtaSection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <main>
      <nav className="marketing-nav">
        <span className="marketing-nav__wordmark">Clubstack</span>
        <Link href="/login" className="marketing-nav__sign-in">
          Sign in
        </Link>
      </nav>
      <Hero />
      <UserTypes />
      <CtaSection />
    </main>
  );
}
