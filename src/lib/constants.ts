/**
 * Application constants and configuration
 */

export const METADATA_PARAMETERS = ['brand'];

export const FORBIDDEN_OS = ['mac-os-x-10-15'];

export const DISPLAY_HIDDEN_VALUES_LENGTH = {
  token: 4,
  signature: 15,
} as const;

export const DEFAULT_THEME = [
  { themeVar: '--color-sf-primary', value: [20, 50, 200] as [number, number, number] },
  { themeVar: '--color-sf-secondary', value: [200, 50, 50] as [number, number, number] },
  { themeVar: '--color-sf-on-secondary', value: [0, 255, 0] as [number, number, number] },
  { themeVar: '--color-sf-tertiary', value: [100, 10, 10] as [number, number, number] },
  { themeVar: '--color-sf-grey', value: [200, 200, 200] as [number, number, number] },
  { themeVar: '--color-sf-light-grey', value: [250, 250, 250] as [number, number, number] },
  { themeVar: '--color-sf-on-light-grey', value: [120, 120, 120] as [number, number, number] },
  { themeVar: '--color-sf-on-grey', value: [200, 200, 200] as [number, number, number] },
  { themeVar: '--color-sf-on-white', value: [51, 51, 51] as [number, number, number] },
  { themeVar: '--color-sf-error', value: [255, 10, 10] as [number, number, number] },
] as const;

export const ERROR_MESSAGES = {
  en: {
    title: 'We are experiencing some technical difficulties...',
    message: 'Please try again in a few minutes. If the issue persists, please get in touch with us.',
  },
  fr: {
    title: 'Nous rencontrons quelques difficultés techniques...',
    message: 'Veuillez réessayer dans quelques minutes. Si le problème persiste, veuillez nous contacter.',
  },
  de: {
    title: 'Wir haben derzeit technische Schwierigkeiten..',
    message: 'Bitte versuchen Sie es in ein paar Minuten erneut. Wenn das Problem weiterhin besteht, kontaktieren Sie uns bitte.',
  },
  it: {
    title: 'Stiamo riscontrando alcune difficoltà tecniche..',
    message: 'Riprova tra qualche minuto. Se il problema persiste, contattaci.',
  },
  nl: {
    title: 'We ondervinden momenteel technische problemen..',
    message: 'Probeer het over een paar minuten opnieuw. Als het probleem aanhoudt, neem dan contact met ons op.',
  },
} as const;

export const LOADING_MESSAGES = {
  en: 'Fetching your document..',
  fr: 'Récupération de votre document..',
  de: 'Dokument wird abgerufen..',
  it: 'Recupero del documento in corso..',
  nl: 'Document wordt opgehaald..',
} as const;

export type SupportedLanguage = keyof typeof ERROR_MESSAGES;

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'fr', 'de', 'it', 'nl'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
