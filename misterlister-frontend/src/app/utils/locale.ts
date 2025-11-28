import { registerLocaleData } from '@angular/common';

export function detectLocaleFromTimezone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const map = {
    // EUROPE
    "Europe/Berlin": "de-DE",
    "Europe/Vienna": "de-AT",
    "Europe/Zurich": "de-CH",
    "Europe/Paris": "fr-FR",
    "Europe/Rome": "it-IT",
    "Europe/Madrid": "es-ES",
    "Europe/Amsterdam": "nl-NL",
    "Europe/Brussels": "nl-BE",
    "Europe/London": "en-GB",
    "Europe/Dublin": "en-IE",
    "Europe/Stockholm": "sv-SE",
    "Europe/Oslo": "nb-NO",
    "Europe/Copenhagen": "da-DK",
    "Europe/Helsinki": "fi-FI",
    "Europe/Warsaw": "pl-PL",
    "Europe/Prague": "cs-CZ",
    "Europe/Budapest": "hu-HU",
    "Europe/Lisbon": "pt-PT",
    "Europe/Athens": "el-GR",
    "Europe/Istanbul": "tr-TR",
    "Europe/Moscow": "ru-RU",
    "Europe/Kiev": "uk-UA",

    // AMERICAS
    "America/New_York": "en-US",
    "America/Los_Angeles": "en-US",
    "America/Chicago": "en-US",
    "America/Denver": "en-US",
    "America/Toronto": "en-CA",
    "America/Vancouver": "en-CA",
    "America/Mexico_City": "es-MX",
    "America/Sao_Paulo": "pt-BR",
    "America/Buenos_Aires": "es-AR",
    "America/Santiago": "es-CL",
    "America/Bogota": "es-CO",

    // ASIA
    "Asia/Tokyo": "ja-JP",
    "Asia/Seoul": "ko-KR",
    "Asia/Shanghai": "zh-CN",
    "Asia/Hong_Kong": "zh-HK",
    "Asia/Singapore": "en-SG",
    "Asia/Bangkok": "th-TH",
    "Asia/Jakarta": "id-ID",
    "Asia/Manila": "fil-PH",
    "Asia/Kolkata": "en-IN",

    // AU / NZ
    "Australia/Sydney": "en-AU",
    "Australia/Melbourne": "en-AU",
    "Pacific/Auckland": "en-NZ"
  };

  return map[tz] || "en-US"; // fallback
}

export async function lazyLoadLocale(locale: string): Promise<void> {
  switch (locale) {

    // === ENGLISH ===
    case 'en':
    case 'en-US': {
      const m = await import('@angular/common/locales/en');
      registerLocaleData(m.default);
      break;
    }

    case 'en-GB': {
      const m = await import('@angular/common/locales/en-GB');
      registerLocaleData(m.default);
      break;
    }


    // === GERMAN ===
    case 'de':
    case 'de-DE': {
      const m = await import('@angular/common/locales/de');
      registerLocaleData(m.default);
      break;
    }

    case 'de-AT': {
      const m = await import('@angular/common/locales/de-AT');
      registerLocaleData(m.default);
      break;
    }

    case 'de-CH': {
      const m = await import('@angular/common/locales/de-CH');
      registerLocaleData(m.default);
      break;
    }


    // === FRENCH ===
    case 'fr':
    case 'fr-FR': {
      const m = await import('@angular/common/locales/fr');
      registerLocaleData(m.default);
      break;
    }

    case 'fr-CA': {
      const m = await import('@angular/common/locales/fr-CA');
      registerLocaleData(m.default);
      break;
    }


    // === SPANISH ===
    case 'es':
    case 'es-ES': {
      const m = await import('@angular/common/locales/es');
      registerLocaleData(m.default);
      break;
    }

    case 'es-MX': {
      const m = await import('@angular/common/locales/es-MX');
      registerLocaleData(m.default);
      break;
    }

    case 'es-AR': {
      const m = await import('@angular/common/locales/es-AR');
      registerLocaleData(m.default);
      break;
    }


    // === ITALIAN ===
    case 'it':
    case 'it-IT': {
      const m = await import('@angular/common/locales/it');
      registerLocaleData(m.default);
      break;
    }


    // === DUTCH ===
    case 'nl':
    case 'nl-NL': {
      const m = await import('@angular/common/locales/nl');
      registerLocaleData(m.default);
      break;
    }

    case 'nl-BE': {
      const m = await import('@angular/common/locales/nl-BE');
      registerLocaleData(m.default);
      break;
    }


    // === PORTUGUESE ===
    case 'pt':
    case 'pt-BR': {
      const m = await import('@angular/common/locales/pt');
      registerLocaleData(m.default);
      break;
    }

    case 'pt-PT': {
      const m = await import('@angular/common/locales/pt-PT');
      registerLocaleData(m.default);
      break;
    }

    default:
      console.warn(`Locale not supported: ${locale}, falling back to en-US`);
      const fallback = await import('@angular/common/locales/en');
      registerLocaleData(fallback.default);
      break;
  }
}
