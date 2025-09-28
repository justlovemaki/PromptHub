import { LANGUAGES, FALLBACK_LANGUAGE } from '../lib/constants';

export const fallbackLng = FALLBACK_LANGUAGE;
export const languages = [LANGUAGES.ENGLISH, LANGUAGES.CHINESE_SIMPLIFIED, LANGUAGES.JAPANESE];
export const defaultNS = 'common'

export function getOptions (lng = fallbackLng as string, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}