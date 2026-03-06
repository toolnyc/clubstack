import Link from "next/link";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        {/* Copyright */}
        <p className="text-sm text-white/40">
          &copy; {currentYear} ClubStack. All rights reserved.
        </p>

        {/* Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            About
          </Link>
          <Link
            href="/terms"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
