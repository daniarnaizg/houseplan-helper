# Feature: Internationalization (i18n)

## Overview

Add multi-language support to HousePlan Helper, starting with English and Spanish. Users can select their preferred language via URL routing or a language toggle, with automatic browser language detection for first-time visitors.

**UI Approach:** URL-based locale routing (`/en/`, `/es/`) with a language selector toggle and auto-detection fallback.

## Priority: Medium
## Complexity: 3/5
## Estimated Dev Time: 3-4 days

---

## Current State Analysis

### Text Content Locations

All text is **hardcoded directly in components** with no separation of content from code.

| Location | Examples |
|----------|----------|
| `PlanEditor.tsx` | "PROJECT**TOOLS**", "Start Calibration", "Calibration Required", "Operation Mode", "Layer Management", "Asset Library", "PAN", "RULER", "AREA", "TEXT" |
| `FileUpload.tsx` | "HousePlan **Helper**", "UPLOAD_SOURCE_FILE", "DROP_FILE_HERE", "Supported Formats: PDF, JPG, PNG" |
| `PdfProcessor.tsx` | "Import PDF", "Page X of Y", "Import Selection", "Failed to load PDF." |
| `FurnitureLibraryModal.tsx` | "Furniture Library", "Search furniture...", "Create Custom Item", "WIDTH (m)", "DEPTH (m)" |
| `FurnitureList.tsx` | "W:", "D:", "R:", "deg", "Rotate -90deg", "Rotate +90deg" |
| `AnnotationsList.tsx` | "Size:", "Enter text...", "CLR", "Text Color", "Background Color" |
| `SidebarGroup.tsx` | "Hide Layer", "Show Layer" |
| `layout.tsx` | Metadata: title, description |
| `useFurnitureLibraryStore.ts` | Furniture names: "Single Bed", "Dining Table (4)", etc. |

### Alert Messages (to be replaced with toasts)

```typescript
// PlanEditor.tsx
alert("Please calibrate the plan first!");
alert("Project imported successfully!");
alert("Invalid project file.");
alert("Could not find plan content.");
alert("Export failed. Please try resetting zoom/pan before exporting.");
```

### Estimated Scope

- **~15-20 components** with hardcoded text
- **~100-150 translatable strings**
- **~25 furniture item names**
- **~6 category names**
- **5 alert messages** to convert to toasts

---

## Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **i18n Library** | `next-intl` | Purpose-built for Next.js App Router, supports RSC, well-maintained |
| **Toast Library** | `sonner` | Lightweight, accessible, excellent DX, replaces `alert()` calls |
| **Translation Format** | JSON | Standard format, easy to edit, good tooling support |

---

## Architecture Design

### URL Structure

```
/en/          -> English version
/es/          -> Spanish version
/             -> Redirects based on: saved preference -> browser lang -> default (en)
```

### File Structure

```
src/
├── i18n/
│   ├── config.ts           # Supported locales, default locale
│   ├── request.ts          # next-intl server configuration
│   └── routing.ts          # Locale routing configuration
├── messages/
│   ├── en.json             # English translations
│   └── es.json             # Spanish translations
├── app/
│   └── [locale]/           # Dynamic locale segment
│       ├── layout.tsx      # Locale-aware layout with NextIntlClientProvider
│       └── page.tsx        # Home page
├── components/
│   ├── LanguageSelector.tsx    # Language toggle component
│   └── ... (existing components - updated with translations)
├── store/
│   └── useUserPreferencesStore.ts  # New: locale + units preferences
├── lib/
│   └── units.ts            # Unit formatting utilities
└── middleware.ts           # Handles locale detection & redirects
```

### Provider Structure

```
app/[locale]/layout.tsx (Server Component)
  ├── Sets <html lang={locale}>
  ├── Loads messages for locale
  └── NextIntlClientProvider (passes messages to client tree)
        └── Toaster (sonner)
              └── page.tsx
                    └── Client Components (use useTranslations hook)
```

---

## Translation File Structure

Organized by feature/component for maintainability:

```json
// messages/en.json
{
  "common": {
    "apply": "Apply",
    "cancel": "Cancel",
    "create": "Create",
    "delete": "Delete",
    "save": "Save",
    "close": "Close"
  },
  "app": {
    "title": "HousePlan Helper",
    "description": "Interactive house plan measurement tool"
  },
  "fileUpload": {
    "title": "HousePlan **Helper**",
    "subtitle": "INITIALIZE PROJECT > UPLOAD BLUEPRINT > CALIBRATE SCALE",
    "uploadSource": "UPLOAD_SOURCE_FILE",
    "dropHere": "DROP_FILE_HERE",
    "supportedFormats": "Supported Formats: PDF, JPG, PNG",
    "systemReady": "SYSTEM_READY",
    "waitingForInput": "WAITING_FOR_INPUT..."
  },
  "pdfProcessor": {
    "title": "Import PDF",
    "pageOf": "Page {current} of {total}",
    "importSelection": "Import Selection",
    "loadFailed": "Failed to load PDF."
  },
  "editor": {
    "projectTools": "PROJECT**TOOLS**",
    "startCalibration": "Start Calibration",
    "calibrationRequired": "Calibration Required",
    "operationMode": "Operation Mode",
    "layerManagement": "Layer Management",
    "assetLibrary": "Asset Library",
    "scaleCalibration": "SCALE_CALIBRATION",
    "noDataPoints": "NO_DATA_POINTS"
  },
  "tools": {
    "pan": "PAN",
    "ruler": "RULER",
    "area": "AREA",
    "text": "TEXT"
  },
  "sidebar": {
    "linear": "Linear",
    "zones": "Zones",
    "assets": "Assets",
    "notes": "Notes",
    "hideLayer": "Hide Layer",
    "showLayer": "Show Layer"
  },
  "furniture": {
    "library": "Furniture Library",
    "search": "Search furniture...",
    "createCustom": "Create Custom Item",
    "itemName": "Item name...",
    "width": "WIDTH ({unit})",
    "depth": "DEPTH ({unit})",
    "color": "COLOR",
    "icon": "ICON",
    "rotate": "Rotate {degrees}deg",
    "categories": {
      "bedroom": "Bedroom",
      "living-room": "Living Room",
      "kitchen-dining": "Kitchen/Dining",
      "office": "Office",
      "bathroom": "Bathroom",
      "custom": "Custom"
    },
    "items": {
      "bed-single": "Single Bed",
      "bed-double": "Double Bed",
      "bed-queen": "Queen Bed",
      "bed-king": "King Bed",
      "wardrobe": "Wardrobe",
      "nightstand": "Nightstand",
      "sofa-2seat": "2-Seat Sofa",
      "sofa-3seat": "3-Seat Sofa",
      "armchair": "Armchair",
      "coffee-table": "Coffee Table",
      "tv-stand": "TV Stand",
      "dining-table-4": "Dining Table (4)",
      "dining-table-6": "Dining Table (6)",
      "dining-chair": "Dining Chair",
      "refrigerator": "Refrigerator",
      "stove-oven": "Stove/Oven",
      "desk-small": "Small Desk",
      "desk-large": "Large Desk",
      "office-chair": "Office Chair",
      "bookshelf": "Bookshelf",
      "toilet": "Toilet",
      "bathtub": "Bathtub",
      "shower": "Shower",
      "bathroom-sink": "Bathroom Sink",
      "custom": "Custom"
    }
  },
  "annotations": {
    "size": "Size:",
    "enterText": "Enter text...",
    "clear": "CLR",
    "textColor": "Text Color",
    "backgroundColor": "Background Color",
    "removeBackground": "Remove background"
  },
  "measurements": {
    "width": "W:",
    "depth": "D:",
    "rotation": "R:",
    "area": "Area:"
  },
  "toast": {
    "calibrateFirst": "Please calibrate the plan first!",
    "projectImported": "Project imported successfully!",
    "invalidProject": "Invalid project file.",
    "contentNotFound": "Could not find plan content.",
    "exportFailed": "Export failed. Please try resetting zoom/pan before exporting."
  },
  "units": {
    "meters": "m",
    "centimeters": "cm",
    "feet": "ft",
    "inches": "in",
    "degrees": "deg",
    "pixels": "px",
    "squareMeters": "m²",
    "squareFeet": "ft²"
  },
  "settings": {
    "language": "Language",
    "units": "Measurement Units",
    "metric": "Metric (m, cm)",
    "imperial": "Imperial (ft, in)"
  }
}
```

---

## Component Integration Patterns

### Client Components (using hooks)

```tsx
// Example: FileUpload.tsx
'use client';

import { useTranslations } from 'next-intl';

export function FileUpload() {
  const t = useTranslations('fileUpload');
  const tCommon = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button>{tCommon('cancel')}</button>
    </div>
  );
}
```

### Furniture Store Integration

**Key Decision:** Derive translation keys from item IDs (don't store `nameKey`).

```tsx
// Data stays clean - no i18n coupling
// useFurnitureLibraryStore.ts
{ id: 'bed-single', category: 'bedroom', width: 0.9, depth: 1.9, ... }

// Component derives key from ID
// FurnitureLibraryModal.tsx
const t = useTranslations('furniture.items');
const tCategories = useTranslations('furniture.categories');

<span>{t(item.id)}</span>
<span>{tCategories(item.category)}</span>
```

This approach:
- Keeps data layer decoupled from i18n structure
- IDs serve as stable keys
- Refactoring translations doesn't break data

### Toast Notifications (replacing alert())

```tsx
// Before:
alert("Please calibrate the plan first!");

// After:
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const t = useTranslations('toast');
toast.warning(t('calibrateFirst'));
```

### Dynamic Values (interpolation)

```tsx
// Translation file:
// "pageOf": "Page {current} of {total}"

// Usage:
t('pageOf', { current: 2, total: 5 })  // "Page 2 of 5"
```

### Pluralization (ICU format)

```tsx
// Translation file:
// "itemCount": "{count, plural, =0 {No items} one {1 item} other {# items}}"

// Usage:
t('itemCount', { count: 3 })  // "3 items"
```

---

## User Preferences Store

New Zustand store for locale and measurement unit preferences:

```typescript
// src/store/useUserPreferencesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Locale = 'en' | 'es';
type MeasurementUnit = 'metric' | 'imperial';

interface UserPreferences {
  locale: Locale | null;           // null = use browser default
  measurementUnit: MeasurementUnit;
  setLocale: (locale: Locale | null) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
}

export const useUserPreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      locale: null,
      measurementUnit: 'metric',
      setLocale: (locale) => set({ locale }),
      setMeasurementUnit: (unit) => set({ measurementUnit: unit }),
    }),
    { name: 'houseplan-user-preferences' }
  )
);
```

### Default Units by Locale

| Locale | Default Unit |
|--------|--------------|
| `en` | `metric` (user can switch to imperial) |
| `es` | `metric` |

---

## Unit Formatting (Separate from i18n)

Units are locale-*related* but not pure translations. Keep them as a separate utility:

```typescript
// src/lib/units.ts
export type MeasurementUnit = 'metric' | 'imperial';

export const UNIT_LABELS = {
  metric: { length: 'm', area: 'm²' },
  imperial: { length: 'ft', area: 'ft²' },
} as const;

export const CONVERSION = {
  metersToFeet: 3.28084,
  sqMetersToSqFeet: 10.7639,
};

export function formatLength(
  meters: number,
  unit: MeasurementUnit,
  locale: string
): string {
  const value = unit === 'imperial' ? meters * CONVERSION.metersToFeet : meters;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${UNIT_LABELS[unit].length}`;
}

export function formatArea(
  squareMeters: number,
  unit: MeasurementUnit,
  locale: string
): string {
  const value = unit === 'imperial' 
    ? squareMeters * CONVERSION.sqMetersToSqFeet 
    : squareMeters;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${UNIT_LABELS[unit].area}`;
}
```

---

## Type Safety

Add TypeScript types derived from the English translation file to prevent key drift:

```typescript
// src/i18n/types.ts
import en from '@/messages/en.json';

export type Messages = typeof en;

// Ensure other locale files match the structure
// This is validated at build time via TypeScript
```

### Build-Time Validation Script

```typescript
// scripts/validate-translations.ts
import en from '../src/messages/en.json';
import es from '../src/messages/es.json';

function getKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? getKeys(value, path)
      : [path];
  });
}

const enKeys = new Set(getKeys(en));
const esKeys = new Set(getKeys(es));

const missingInEs = [...enKeys].filter(k => !esKeys.has(k));
const extraInEs = [...esKeys].filter(k => !enKeys.has(k));

if (missingInEs.length || extraInEs.length) {
  console.error('Translation key mismatch!');
  if (missingInEs.length) console.error('Missing in es.json:', missingInEs);
  if (extraInEs.length) console.error('Extra in es.json:', extraInEs);
  process.exit(1);
}

console.log('All translation keys are in sync!');
```

Add to `package.json`:
```json
{
  "scripts": {
    "validate:i18n": "npx tsx scripts/validate-translations.ts"
  }
}
```

---

## SEO Metadata Translation

Use `generateMetadata` for locale-aware metadata:

```typescript
// src/app/[locale]/layout.tsx
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}
```

---

## Middleware Configuration

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|es)/:path*']
};
```

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localeDetection: true,  // Auto-detect browser language
});
```

```typescript
// src/i18n/config.ts
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
```

---

## Language Selector Component

```tsx
// src/components/LanguageSelector.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useUserPreferencesStore } from '@/store/useUserPreferencesStore';

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
    setLocale(newLocale);
    // Replace locale segment in pathname
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex gap-1">
      {Object.entries(LOCALE_LABELS).map(([loc, label]) => (
        <button
          key={loc}
          onClick={() => handleChange(loc as 'en' | 'es')}
          className={`px-2 py-1 text-xs font-mono ${
            locale === loc 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

---

## Error Handling

### Missing Translation Fallback

Configure `next-intl` to handle missing keys gracefully:

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
    onError(error) {
      // Log missing translations in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Translation error:', error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      // Return the key itself as fallback (visible in dev)
      return `[${namespace}.${key}]`;
    },
  };
});
```

---

## Implementation Plan

### Phase 1: Infrastructure Setup (Day 1)

1. Install dependencies:
   ```bash
   npm install next-intl sonner
   ```

2. Create i18n configuration files:
   - `src/i18n/config.ts`
   - `src/i18n/routing.ts`
   - `src/i18n/request.ts`

3. Create middleware (`src/middleware.ts`)

4. Restructure app directory:
   - Move `src/app/page.tsx` to `src/app/[locale]/page.tsx`
   - Update `src/app/layout.tsx` to `src/app/[locale]/layout.tsx`
   - Add `NextIntlClientProvider` wrapper

5. Create initial translation files:
   - `src/messages/en.json` (with all current English strings)
   - `src/messages/es.json` (copy of en.json as placeholder)

6. Create user preferences store (`src/store/useUserPreferencesStore.ts`)

### Phase 2: Toast Migration (Day 1-2)

1. Set up sonner `<Toaster />` in layout
2. Replace all 5 `alert()` calls with `toast()` + translations
3. Test toast functionality

### Phase 3: Component Migration (Day 2-3)

Migrate components in order of complexity:

| Order | Component | Strings | Notes |
|-------|-----------|---------|-------|
| 1 | `FileUpload.tsx` | ~8 | Good isolated test case |
| 2 | `SidebarGroup.tsx` | ~2 | Simple, reusable |
| 3 | `AnnotationsList.tsx` | ~6 | Medium complexity |
| 4 | `FurnitureList.tsx` | ~6 | Has unit labels |
| 5 | `MeasurementsList.tsx` | ~4 | Has unit labels |
| 6 | `AreasList.tsx` | ~3 | Has unit labels |
| 7 | `PdfProcessor.tsx` | ~4 | Has interpolation |
| 8 | `FurnitureLibraryModal.tsx` | ~12 | Complex with search |
| 9 | `FurnitureQuickAccess.tsx` | ~3 | References furniture items |
| 10 | `PlanEditor.tsx` | ~40 | Largest component |

### Phase 4: Furniture Library Update (Day 3)

1. Update furniture item IDs in `useFurnitureLibraryStore.ts` to match translation keys
2. Update components to derive names from `t(\`furniture.items.${item.id}\`)`
3. Update category references similarly

### Phase 5: Spanish Translations (Day 3-4)

1. Translate all strings in `es.json`
2. Run validation script
3. Test all components in Spanish

### Phase 6: UI Polish (Day 4)

1. Add `LanguageSelector` component to header/toolbar
2. Add unit selector to settings (if settings panel exists)
3. Create unit formatting utilities
4. Test locale switching and persistence

### Phase 7: Testing & Validation

1. Run translation validation script
2. Test all components in both languages
3. Test locale detection (new browser session)
4. Test preference persistence (localStorage)
5. Test URL routing (`/en/`, `/es/`, `/`)
6. Verify SEO metadata per locale

---

## Future Considerations

| Item | Notes |
|------|-------|
| **Additional languages** | Add new `.json` file + update `locales` array |
| **RTL support** | Not needed for en/es, but next-intl supports it |
| **Translation management** | Consider Crowdin/Lokalise if team grows |
| **Dynamic content** | User-created annotations stay in original language |
| **Export localization** | Exported images could include locale-aware labels |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "next-intl": "^3.x",
    "sonner": "^1.x"
  }
}
```

---

## Files to Create/Modify

### New Files
- `src/i18n/config.ts`
- `src/i18n/routing.ts`
- `src/i18n/request.ts`
- `src/i18n/types.ts`
- `src/messages/en.json`
- `src/messages/es.json`
- `src/middleware.ts`
- `src/store/useUserPreferencesStore.ts`
- `src/lib/units.ts`
- `src/components/LanguageSelector.tsx`
- `scripts/validate-translations.ts`

### Modified Files
- `src/app/layout.tsx` -> `src/app/[locale]/layout.tsx`
- `src/app/page.tsx` -> `src/app/[locale]/page.tsx`
- `src/components/PlanEditor.tsx`
- `src/components/FileUpload.tsx`
- `src/components/PdfProcessor.tsx`
- `src/components/FurnitureLibraryModal.tsx`
- `src/components/FurnitureQuickAccess.tsx`
- `src/components/FurnitureList.tsx`
- `src/components/MeasurementsList.tsx`
- `src/components/AreasList.tsx`
- `src/components/AnnotationsList.tsx`
- `src/components/SidebarGroup.tsx`
- `src/store/useFurnitureLibraryStore.ts` (update IDs)
- `next.config.ts` (if plugin needed)
- `package.json` (add dependencies + validation script)
