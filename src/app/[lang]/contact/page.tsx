import { getTranslation } from '@/i18n'

export default async function Contact({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'contact')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('title')}</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            {t('description')}
          </p>
          <p className="text-gray-800 font-medium">
            {t('email')}
          </p>
        </div>
      </div>
    </div>
  )
}