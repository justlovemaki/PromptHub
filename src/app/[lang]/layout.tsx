import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ApiProvider } from '../../components/ApiProvider'
import { ToastProvider } from '../../components/ToastProvider'
import { getTranslation } from '../../i18n'

const inter = Inter({ subsets: ['latin'] })

// 获取多语言元数据
const getMetadata = async (lang: string) => {
  const { t } = await getTranslation(lang, 'layout')
  return {
    title: t('title'),
    description: t('description')
  }
}

export async function generateMetadata({ params }: { params: { lang: string } }) {
  const metadata = await getMetadata(params.lang)

  return {
    title: metadata.title,
    description: metadata.description,
  }
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  return (
    <html lang={params.lang}>
      <body className={inter.className}>
        <ToastProvider>
          <ApiProvider>
            {children}
          </ApiProvider>
        </ToastProvider>
      </body>
    </html>
  )
}