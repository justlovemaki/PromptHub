import { getTranslation } from '@/i18n'

export default async function Privacy({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'common')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('privacy')}</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {params.lang === 'zh-CN' && '隐私政策'}
            {params.lang === 'ja' && 'プライバシーポリシー'}
            {params.lang === 'en' && 'Privacy Policy'}
          </h2>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '我们尊重您的隐私，并致力于保护您的个人信息。'}
            {params.lang === 'ja' && '当社はお客様のプライバシーを尊重し、個人情報を保護することに努めています。'}
            {params.lang === 'en' && 'We respect your privacy and are committed to protecting your personal information.'}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {params.lang === 'zh-CN' && '1. 我们收集的信息'}
            {params.lang === 'ja' && '1. 当社が収集する情報'}
            {params.lang === 'en' && '1. Information We Collect'}
          </h3>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '我们可能会收集您直接提供给我们的信息，例如当您创建账户或联系我们时。'}
            {params.lang === 'ja' && '当社は、お客様がアカウントを作成したり、当社にお問い合わせいただいたりする際に、直接提供していただいた情報を収集することがあります。'}
            {params.lang === 'en' && 'We may collect information you provide directly to us, such as when you create an account or contact us.'}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {params.lang === 'zh-CN' && '2. 我们如何使用您的信息'}
            {params.lang === 'ja' && '2. お客様の情報の利用方法'}
            {params.lang === 'en' && '2. How We Use Your Information'}
          </h3>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '我们使用您的信息来提供、维护和改进我们的服务。'}
            {params.lang === 'ja' && '当社は、お客様の情報をサービスの提供、維持、改善のために利用します。'}
            {params.lang === 'en' && 'We use your information to provide, maintain, and improve our services.'}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {params.lang === 'zh-CN' && '3. 信息共享'}
            {params.lang === 'ja' && '3. 情報の共有'}
            {params.lang === 'en' && '3. Information Sharing'}
          </h3>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '除非本政策中另有说明，否则我们不会与第三方共享您的个人信息。'}
            {params.lang === 'ja' && '本ポリシーに別段の定めがある場合を除き、当社はお客様の個人情報を第三者と共有しません。'}
            {params.lang === 'en' && 'We do not share your personal information with third parties except as described in this policy.'}
          </p>
        </div>
      </div>
    </div>
  )
}