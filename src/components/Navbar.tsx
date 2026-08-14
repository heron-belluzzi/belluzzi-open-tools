"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  alternateLocalePath,
  belluzziCampaignUrl,
  isLocale,
  localizedPath,
  REPOSITORY_URL,
  type Locale,
} from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");
  const localeValue = useLocale();
  const locale: Locale = isLocale(localeValue) ? localeValue : "pt";
  const pathname = usePathname();
  const router = useRouter();
  const home = localizedPath(locale, "home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function switchLocale() {
    const nextLocale: Locale = locale === "pt" ? "en" : "pt";
    router.push(alternateLocalePath(pathname, nextLocale));
  }

  const links = [
    { label: t("tools"), href: `${home}#tools`, external: false },
    { label: t("source"), href: REPOSITORY_URL, external: true },
    {
      label: t("belluzzi"),
      href: belluzziCampaignUrl(locale, "navigation"),
      external: true,
    },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-label={t("label")}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-border bg-bg/90 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href={home}
          className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-ink"
        >
          Belluzzi <span className="text-accent">Open Tools.</span>
        </a>

        <div className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={switchLocale}
            className="hidden rounded-md px-2.5 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:flex"
            aria-label={t("lang_label")}
          >
            {t("lang_switch")}
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="ml-1 rounded-md p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
            aria-label={t("menu_label")}
            aria-expanded={mobileOpen}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border bg-bg/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-5">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  switchLocale();
                  setMobileOpen(false);
                }}
                className="rounded-lg px-3 py-3 text-left font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:hidden"
              >
                {t("lang_switch")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
