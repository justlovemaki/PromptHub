import { getTranslation } from '@/i18n'

export default async function Terms({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'terms')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('title')}</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('title')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('welcomeMessage')}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {t('section1.title')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('section1.content')}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {t('section2.title')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('section2.content')}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {t('section3.title')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('section3.content')}
          </p>
        </div>
      </div>
    </div>
  )
}