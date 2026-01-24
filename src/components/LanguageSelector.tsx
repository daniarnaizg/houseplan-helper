'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useUserPreferencesStore } from '@/store/useUserPreferencesStore';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALE_LABELS = {
  en: 'EN',
  es: 'ES',
} as const;

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const setLocale = useUserPreferencesStore((s) => s.setLocale);

  const handleChange = (newLocale: 'en' | 'es') => {
    if (newLocale === locale) return;
    
    setLocale(newLocale);
    // Replace locale segment in pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      <Globe size={14} className="text-muted-foreground" />
      {Object.entries(LOCALE_LABELS).map(([loc, label]) => (
        <button
          key={loc}
          onClick={() => handleChange(loc as 'en' | 'es')}
          className={cn(
            "px-2 py-1 text-xs font-mono font-bold transition-all border-2",
            locale === loc
              ? "bg-primary text-white border-primary"
              : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
