'use client'

import { useState } from 'react'
import CategorySelector from '@/components/CategorySelector'
import ImageUploader from '@/components/ImageUploader'
import ResultView from '@/components/ResultView'
import { ProductCategory } from '@/types'
import type { CheckResult } from '@/types'

type Step = 'select' | 'upload' | 'checking' | 'result'

export default function Home() {
  const [step, setStep] = useState<Step>('select')
  const [category, setCategory] = useState<ProductCategory | null>(null)
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleCategorySelect(cat: ProductCategory) {
    setCategory(cat)
    setStep('upload')
  }

  function handleImageReady(base64: string, mimeType: string) {
    if (!base64) {
      setImageData(null)
      return
    }
    setImageData({ base64, mimeType })
  }

  async function handleCheck() {
    if (!category || !imageData) return
    setStep('checking')
    setError(null)

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          imageBase64: imageData.base64,
          mimeType: imageData.mimeType,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '서버 오류가 발생했습니다.')
      }

      const data: CheckResult = await res.json()
      setResult(data)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setStep('upload')
    }
  }

  function handleReset() {
    setStep('select')
    setCategory(null)
    setImageData(null)
    setResult(null)
    setError(null)
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">제품 표시사항 적합성 검토</h1>
            <p className="text-xs text-gray-500">관련 법령 기준에 따른 AI 자동 검토 시스템</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {step === 'result' && result ? (
          <ResultView result={result} onReset={handleReset} />
        ) : (
          <>
            {/* Step 1: Category */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                  ${category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </span>
                <h2 className="font-semibold text-gray-800">제품 카테고리 선택</h2>
              </div>
              <CategorySelector selected={category} onSelect={handleCategorySelect} />
            </section>

            {/* Step 2: Image upload */}
            {(step === 'upload' || step === 'checking') && category && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                    ${imageData ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </span>
                  <h2 className="font-semibold text-gray-800">표시사항 이미지 업로드</h2>
                </div>
                <ImageUploader onImageReady={handleImageReady} />

                {error && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    오류: {error}
                  </div>
                )}

                <button
                  onClick={handleCheck}
                  disabled={!imageData || step === 'checking'}
                  className="mt-4 w-full py-3 px-6 rounded-xl font-semibold text-white transition-all
                    bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {step === 'checking' ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      OCR 및 법령 검토 중…
                    </>
                  ) : (
                    <>🔍 적합성 검토 시작</>
                  )}
                </button>

                {step === 'checking' && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    이미지 OCR → 관련 법령 조회 → 항목별 적합성 분석 중입니다. 약 30~60초 소요됩니다.
                  </p>
                )}
              </section>
            )}

            {/* Law references */}
            {category && (
              <LawReferences category={category} />
            )}
          </>
        )}
      </div>
    </main>
  )
}

function LawReferences({ category }: { category: ProductCategory }) {
  const { CATEGORIES } = require('@/lib/categories')
  const info = CATEGORIES.find((c: { id: string }) => c.id === category)
  if (!info) return null

  return (
    <section>
      <h3 className="text-sm font-medium text-gray-500 mb-2">검토 기준 법령</h3>
      <div className="flex flex-wrap gap-2">
        {info.laws.map((law: { name: string; type: string }, idx: number) => (
          <span key={idx} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {law.name}
          </span>
        ))}
      </div>
    </section>
  )
}
