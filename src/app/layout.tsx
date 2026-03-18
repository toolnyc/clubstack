import type { Metadata } from "next";
import "./globals.css";
import { neueMontreal, inter, khInterference } from "./fonts";

export const metadata: Metadata = {
  title: "Clubstack",
  description: "DJ booking tool for underground clubs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${neueMontreal.variable} ${inter.variable} ${khInterference.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'light' || theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', theme);
                } else {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
