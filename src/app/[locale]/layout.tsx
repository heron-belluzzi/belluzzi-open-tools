import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/config";
import { GOOGLE_ANALYTICS_ID } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isPt = locale === "pt";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: isPt
        ? "Ferramentas gratuitas e open source | Belluzzi"
        : "Free and open source tools | Belluzzi",
      template: `%s | ${SITE_NAME}`,
    },
    description: isPt
      ? "Ferramentas gratuitas, abertas e focadas em privacidade para pessoas, empresas e desenvolvedores."
      : "Free, open and privacy-first tools for people, businesses and developers.",
    openGraph: {
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      title: isPt
        ? "Belluzzi Open Tools: utilidade com privacidade"
        : "Belluzzi Open Tools: useful with privacy",
      description: isPt
        ? "Ferramentas abertas que resolvem tarefas reais sem transformar seus dados em produto."
        : "Open tools that solve real tasks without turning your data into a product.",
      type: "website",
      locale: isPt ? "pt_BR" : "en_US",
      alternateLocale: isPt ? "en_US" : "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
    },
    icons: {
      icon: "/belluzzi-open-tools.svg",
    },
    robots: "index, follow",
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        "pt-BR": `${SITE_URL}/pt`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/pt`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} bg-bg font-sans text-ink antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={GOOGLE_ANALYTICS_ID} />
      </body>
    </html>
  );
}
