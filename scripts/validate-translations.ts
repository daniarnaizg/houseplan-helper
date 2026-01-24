import * as fs from 'fs';
import * as path from 'path';

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

function getKeys(obj: TranslationObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? getKeys(value as TranslationObject, currentPath)
      : [currentPath];
  });
}

function main() {
  const messagesDir = path.join(process.cwd(), 'src', 'messages');
  
  // Load English (source of truth)
  const enPath = path.join(messagesDir, 'en.json');
  const en: TranslationObject = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const enKeys = new Set(getKeys(en));
  
  // Get all other locale files
  const localeFiles = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json') && f !== 'en.json');
  
  let hasErrors = false;
  
  for (const file of localeFiles) {
    const localePath = path.join(messagesDir, file);
    const locale: TranslationObject = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    const localeKeys = new Set(getKeys(locale));
    
    const missingKeys = [...enKeys].filter(k => !localeKeys.has(k));
    const extraKeys = [...localeKeys].filter(k => !enKeys.has(k));
    
    if (missingKeys.length > 0) {
      console.error(`\n❌ Missing keys in ${file}:`);
      missingKeys.forEach(k => console.error(`   - ${k}`));
      hasErrors = true;
    }
    
    if (extraKeys.length > 0) {
      console.error(`\n⚠️  Extra keys in ${file} (not in en.json):`);
      extraKeys.forEach(k => console.error(`   - ${k}`));
      hasErrors = true;
    }
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${file} - All ${localeKeys.size} keys in sync`);
    }
  }
  
  if (hasErrors) {
    console.error('\n❌ Translation validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All translation files are in sync!');
  }
}

main();
