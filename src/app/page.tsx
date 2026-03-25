import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { UserTypes } from "@/components/marketing/user-types";
import { CtaSection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <main>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.05em] text-text-secondary">
          Clubstack
        </span>
        <Link
          href="/login"
          className="font-mono text-sm text-text-secondary no-underline px-3 py-2 border border-border-primary rounded-sm transition-colors duration-150 hover:text-text-primary hover:border-text-primary"
        >
          Sign in
        </Link>
      </nav>
      <Hero />
      <UserTypes />
      <CtaSection />
    </main>
  );
}
