import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fallbackLng, languages } from './i18n/settings'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname already includes a locale
  const pathnameIsMissingLocale = languages.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // If the pathname is missing a locale, redirect to the default locale
  if (pathnameIsMissingLocale) {
    // 修复：确保重定向URL正确构建
    const url = request.nextUrl.clone()
    url.pathname = `/${fallbackLng}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}