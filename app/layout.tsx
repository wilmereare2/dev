import type { Metadata } from "next";
import { Figtree, Sora } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/providers/pwa-register";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { auth } from "@/lib/auth/auth";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { resolveAppLocale } from "@/lib/i18n/resolve-app-locale";
import "./globals.css";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: false,
    title: APP_NAME,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#030305" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userId = session?.user
    ? await resolveDbUserId({ id: session.user.id, email: session.user.email })
    : null;
  const locale = await resolveAppLocale(userId);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <I18nProvider locale={locale}>
            <AuthSessionProvider>
              <PwaRegister />
              {children}
            </AuthSessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
