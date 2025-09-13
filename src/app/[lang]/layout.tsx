import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// 为不同的语言提供静态元数据
const getMetadata = (lang: string) => {
  switch (lang) {
    case 'zh-CN':
      return {
        title: '播客模板',
        description: '播客应用程序模板'
      }
    case 'ja':
      return {
        title: 'ポッドキャストテンプレート',
        description: 'ポッドキャストアプリケーションのテンプレート'
      }
    default: // English
      return {
        title: 'Podcast Template',
        description: 'A template for podcast applications'
      }
  }
}

export async function generateMetadata({ params }: { params: { lang: string } }) {
  const metadata = getMetadata(params.lang)
  
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}