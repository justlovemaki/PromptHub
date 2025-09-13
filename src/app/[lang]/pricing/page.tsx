import { getTranslation } from '@/i18n'

export default async function Pricing({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'common')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t('pricing')}</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {params.lang === 'zh-CN' && '基础计划'}
            {params.lang === 'ja' && '基本プラン'}
            {params.lang === 'en' && 'Basic Plan'}
          </h2>
          <p className="text-gray-600 mb-4">
            {params.lang === 'zh-CN' && '免费计划，包含基本功能。'}
            {params.lang === 'ja' && '基本機能付きの無料プラン。'}
            {params.lang === 'en' && 'Free plan with basic features.'}
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>
              {params.lang === 'zh-CN' && '每月最多创建5个播客'}
              {params.lang === 'ja' && '月間5つのポッドキャスト作成'}
              {params.lang === 'en' && 'Create up to 5 podcasts per month'}
            </li>
            <li>
              {params.lang === 'zh-CN' && '基本音频质量'}
              {params.lang === 'ja' && '基本音声品質'}
              {params.lang === 'en' && 'Basic audio quality'}
            </li>
            <li>
              {params.lang === 'zh-CN' && '电子邮件支持'}
              {params.lang === 'ja' && 'メールサポート'}
              {params.lang === 'en' && 'Email support'}
            </li>
          </ul>
          <button className="bg-brand-purple text-white px-4 py-2 rounded hover:bg-brand-pink">
            {params.lang === 'zh-CN' && '开始使用'}
            {params.lang === 'ja' && '始める'}
            {params.lang === 'en' && 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  )
}