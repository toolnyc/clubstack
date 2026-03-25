import { WaitlistForm } from "./waitlist-form";

export function CtaSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-6">
        <p className="font-mono text-sm text-accent-neon uppercase tracking-wider">
          Private beta
        </p>
        <h2 className="font-[var(--font-display)] text-4xl font-semibold text-text-primary text-center">
          Get early access.
        </h2>
        <p className="font-body text-base text-text-secondary text-center max-w-md">
          Onboarding DJs, promoters, and agencies in New York first.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}
