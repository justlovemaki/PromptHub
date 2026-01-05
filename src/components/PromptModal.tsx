import { Modal, ModalContent, ModalHeader, ModalTitle, Button, Input, Textarea } from '@promptmanager/ui-components'
import TagSelector from './TagSelector'
import { useTranslation } from '@/i18n/client'
import { type Prompt, isVideo } from '@promptmanager/core-logic'
import { type FormEvent, useState } from 'react'

interface PromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    title: string
    description: string
    content: string
    tags: string[]
    imageUrls?: string[]
    author: string
    visibility: 'public' | 'private'
  }
  setFormData: (data: any) => void
  editingPrompt?: Prompt | null
  operationLoading: boolean
  onSubmit: () => void
  lang: string
  existingTags: string[]
}

export default function PromptModal({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingPrompt,
  operationLoading,
  onSubmit,
  lang,
  existingTags
}: PromptModalProps) {
  const { t } = useTranslation(lang, 'dashboard')
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const isEditing = !!editingPrompt

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      tags: [],
      imageUrls: [],
      author: '',
      visibility: 'private'
    })
  }

  const handleClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      resetForm()
      if (editingPrompt) {
        // 编辑模式关闭时清除编辑状态
        setFormData({
          title: '',
          description: '',
          content: '',
          tags: [],
          imageUrls: [],
          author: '',
          visibility: 'private'
        })
      }
    }
  }

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="2xl" className="flex flex-col max-h-[90vh]">
        <ModalHeader className="flex-shrink-0">
          <ModalTitle>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 bg-gradient-to-br ${isEditing ? 'from-orange-100 to-orange-200' : 'from-primary-100 to-accent-100'} rounded-xl flex items-center justify-center shadow-sm`}>
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isEditing ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  )}
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-text-100">
                  {isEditing ? t('editPrompt') : t('createModal.title')}
                </div>
                <div className="text-sm text-text-300 font-normal">
                  {isEditing ? t('editPromptDescription') : t('createModal.description')}
                </div>
              </div>
            </div>
          </ModalTitle>
        </ModalHeader>
        
        <div className="px-4 md:px-8 py-4 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          <div className="grid gap-4 md:gap-6">
            {/* 基本信息区域 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-200 border-b border-bg-200 pb-3">
                <svg className="h-4 w-4 text-primary-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('basicInfo')}
              </div>
              
              <div className="grid gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {t('fieldTitle')} <span className="text-error-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t('placeholders.title')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-transparent rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {t('fieldDescription')}
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('placeholders.description')}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-transparent rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {t('fieldAuthor') || '作者'}
                  </label>
                  <Input
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder={t('placeholders.author') || '请输入作者名称'}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-transparent rounded-xl px-4 py-3"
                  />
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-200 border-b border-bg-200 pb-3">
                <svg className="h-4 w-4 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('promptContent')}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-200 mb-2">
                  {t('content')} <span className="text-error-500">*</span>
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder={t('placeholders.content')}
                  rows={4}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-transparent resize-none rounded-xl px-4 py-3"
                />
                <div className="mt-2 text-xs text-text-300 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('characterCount')}{formData.content.length}
                </div>
                
                {/* 模板变量使用示例 */}
                <div className="mt-3 p-3 md:p-4 bg-primary-300 rounded-lg border border-primary-300">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary-100 mb-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('templateVariableExample.title')}
                  </div>
                  <p className="text-xs text-text-200 mb-2">{t('templateVariableExample.description')}</p>
                  <div className="text-xs text-text-200 space-y-1">
                    <div className="mt-2 text-primary-100 font-mono bg-primary-300 px-2 py-1 rounded inline-block">
                      {t('templateVariableExample.format')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 设置区域 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-200 border-b border-bg-200 pb-3">
                <svg className="h-4 w-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('settings')}
              </div>
              
              <div className="grid gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {t('visibility')}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.visibility}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                      className="w-full px-4 py-3 border border-bg-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent bg-white transition-all duration-200 appearance-none pr-10"
                    >
                      <option value="private">{t('privateVisibility')}</option>
                      <option value="public">{t('publicVisibility')}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-4 w-4 text-text-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {t('tags')}
                  </label>
                  <TagSelector
                    selectedKeys={formData.tags}
                    onChange={(keys) => handleInputChange('tags', keys)}
                    language={lang}
                    placeholder={t('tagSelectorPlaceholder')}
                    className=""
                    isEditing={isEditing}
                    existingTags={existingTags}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {t('imageUrls')}
                  </label>
                  <div className="space-y-2">
                    {Array.isArray(formData.imageUrls) && formData.imageUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={url}
                            onChange={(e) => {
                              const currentUrls = Array.isArray(formData.imageUrls) ? formData.imageUrls : []
                              const newUrls = [...currentUrls]
                              newUrls[index] = e.target.value
                              handleInputChange('imageUrls', newUrls)
                            }}
                            placeholder={t('placeholders.imageUrl')}
                            className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-transparent rounded-xl px-4 py-3"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            const currentUrls = Array.isArray(formData.imageUrls) ? formData.imageUrls : []
                            const newUrls = currentUrls.filter((_, i) => i !== index)
                            handleInputChange('imageUrls', newUrls)
                          }}
                          variant="outline"
                          className="px-3 flex-shrink-0"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => {
                            if (url && url.trim()) {
                              setPreviewImageUrl(url)
                            }
                          }}
                          variant="outline"
                          className="px-3 flex-shrink-0"
                          disabled={!url || !url.trim()}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => {
                        const currentUrls = Array.isArray(formData.imageUrls) ? formData.imageUrls : []
                        handleInputChange('imageUrls', [...currentUrls, ''])
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {t('addImageUrl')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作区域 */}
        <div className="px-4 md:px-8 py-4 bg-bg-200 border-t border-bg-200 rounded-b-2xl flex-shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="text-xs md:text-sm text-text-300 order-2 md:order-1">
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isEditing ? t('changesWillTakeEffect') : t('requiredFieldsHint')}
              </span>
            </div>
            <div className="flex space-x-2 md:space-x-3 order-1 md:order-2">
              <Button
                onClick={onSubmit}
                disabled={operationLoading || !formData.title.trim() || !formData.content.trim()}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2 ${
                  isEditing 
                    ? 'bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-100' 
                    : 'bg-gradient-to-r from-primary-100 to-accent-100 hover:from-accent-100 hover:to-primary-100'
                } transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl`}
              >
                {operationLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? t('saving') : t('creating')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('saveChanges')}
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {t('createPrompt')}
                      </>
                    )}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>

      {/* 图片预览全屏模态框 */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(previewImageUrl) ? (
              <video
                src={previewImageUrl}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={previewImageUrl}
                alt="预览图片"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const errorDiv = document.createElement('div')
                  errorDiv.className = 'text-white text-center p-8 bg-red-500/20 rounded-lg'
                  errorDiv.innerHTML = `
                    <svg class="h-16 w-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-lg font-medium">资源加载失败</p>
                    <p class="text-sm text-gray-300 mt-2">请检查资源链接是否正确</p>
                  `
                  target.parentElement?.appendChild(errorDiv)
                }}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}