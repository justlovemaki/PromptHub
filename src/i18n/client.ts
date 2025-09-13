'use client'

import { useEffect, useState } from 'react'
import i18next from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getOptions } from './settings'

const runsOnServerSide = typeof window === 'undefined'

i18next
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => import(`../../public/locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    lng: undefined, // detect the language on the client
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
    preload: runsOnServerSide ? ['en', 'zh-CN', 'ja'] : []
  })

export function useTranslation(lng: string, ns = 'common') {
  const ret = useTranslationOrg(ns)
  const { i18n } = ret
  if (runsOnServerSide && i18n.language !== lng) {
    i18n.changeLanguage(lng)
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useClientLanguageChange(lng, i18n)
  }
  return ret
}

function useClientLanguageChange(lng: string, i18n: any) {
  const [activeLng, setActiveLng] = useState(i18n.language)
  useEffect(() => {
    if (activeLng === i18n.language) return
    setActiveLng(i18n.language)
  }, [activeLng, i18n])
  useEffect(() => {
    if (!lng || i18n.language === lng) return
    i18n.changeLanguage(lng)
  }, [lng, i18n])
}