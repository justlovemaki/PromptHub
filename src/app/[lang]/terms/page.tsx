import { getTranslation } from '@/i18n'

export default async function Terms({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'common')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('terms')}</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {params.lang === 'zh-CN' && '服务条款'}
            {params.lang === 'ja' && '利用規約'}
            {params.lang === 'en' && 'Terms of Service'}
          </h2>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '欢迎使用我们的播客模板。通过访问或使用我们的服务，您同意受这些条款的约束。'}
            {params.lang === 'ja' && '当社のポッドキャストテンプレートをご利用いただきありがとうございます。当社のサービスにアクセスまたはご利用いただくことにより、これらの規則に同意したものとみなされます。'}
            {params.lang === 'en' && 'Welcome to our podcast template. By accessing or using our service, you agree to be bound by these terms.'}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {params.lang === 'zh-CN' && '1. 服务使用'}
            {params.lang === 'ja' && '1. サービスの利用'}
            {params.lang === 'en' && '1. Use of Service'}
          </h3>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '您同意仅将我们的服务用于合法目的，并遵守这些条款。'}
            {params.lang === 'ja' && '当社のサービスは、合法的な目的でのみご利用いただけます。また、これらの規則に従う必要があります。'}
            {params.lang === 'en' && 'You agree to use our service only for lawful purposes and in accordance with these terms.'}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {params.lang === 'zh-CN' && '2. 知识产权'}
            {params.lang === 'ja' && '2. 知的財産権'}
            {params.lang === 'en' && '2. Intellectual Property'}
          </h3>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '通过我们的服务提供的所有内容和材料均为我们公司或我们的许可方的财产。'}
            {params.lang === 'ja' && '当社のサービスを通じて提供されるすべてのコンテンツおよび資料は、当社または当社のライセンサーの所有物です。'}
            {params.lang === 'en' && 'All content and materials provided through our service are the property of our company or our licensors.'}
          </p>
          <h3 className="text-lg font-medium mb-2">
            {params.lang === 'zh-CN' && '3. 责任限制'}
            {params.lang === 'ja' && '3. 責任の制限'}
            {params.lang === 'en' && '3. Limitation of Liability'}
          </h3>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '对于任何间接、附带、特殊、后果性或惩罚性损害，我们不承担任何责任。'}
            {params.lang === 'ja' && '当社は、間接的、付随的、特別、結果的または懲罰的な損害について、一切責任を負いません。'}
            {params.lang === 'en' && 'We shall not be liable for any indirect, incidental, special, consequential or punitive damages.'}
          </p>
        </div>
      </div>
    </div>
  )
}