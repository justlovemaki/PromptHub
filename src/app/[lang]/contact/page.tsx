import { getTranslation } from '@/i18n'

export default async function Contact({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'common')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('contact')}</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '如需支持或咨询，请联系我们：'}
            {params.lang === 'ja' && 'サポートやお問い合わせは、以下までご連絡ください：'}
            {params.lang === 'en' && 'For support or inquiries, please contact us at:'}
          </p>
          <p className="text-gray-800 font-medium">
            support@podcasttemplate.com
          </p>
        </div>
      </div>
    </div>
  )
}