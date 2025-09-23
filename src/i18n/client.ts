'use client'

import { useEffect, useState } from 'react'
import i18next from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getOptions, fallbackLng, languages } from './settings'

const runsOnServerSide = typeof window === 'undefined'

i18next
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => import(`../../public/locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    lng: fallbackLng, // 明确设置为 fallbackLng
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
    preload: runsOnServerSide ? languages : []
  })

export function useTranslation(lng: string, ns = 'common') {
  const ret = useTranslationOrg(ns)
  const { i18n } = ret
  // console.log('useTranslation', i18n.resolvedLanguage, lng)

  // 在客户端挂载后，确保 i18n 实例的语言与传入的 lng 参数一致
  useEffect(() => {
    // if (i18n.resolvedLanguage === lng) return;
    i18n.changeLanguage(lng);
  }, [lng, i18n]);
  
  return ret
}