'use client'

import { CheckResult, CheckItem } from '@/types'

const STATUS_CONFIG = {
  compliant: {
    label: '적합',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  non_compliant: {
    label: '부적합',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: '❌',
  },
  needs_improvement: {
    label: '보완 필요',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    icon: '⚠️',
  },
  not_found: {
    label: '미확인',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    icon: '🔍',
  },
  not_applicable: {
    label: '해당 없음',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    icon: '—',
  },
}

const OVERALL_CONFIG = {
  compliant: { label: '전체 적합', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
  non_compliant: { label: '부적합 항목 있음', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
  needs_improvement: { label: '보완 필요', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
}

interface Props {
  result: CheckResult
  onReset: () => void
}

export default function ResultView({ result, onReset }: Props) {
  const overall = OVERALL_CONFIG[result.overallStatus]

  const grouped = {
    non_compliant: result.items.filter((i) => i.status === 'non_compliant'),
    needs_improvement: result.items.filter((i) => i.status === 'needs_improvement'),
    not_found: result.items.filter((i) => i.status === 'not_found'),
    compliant: result.items.filter((i) => i.status === 'compliant'),
    not_applicable: result.items.filter((i) => i.status === 'not_applicable'),
  }

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <div className={`rounded-2xl border-2 ${overall.border} ${overall.bg} p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{result.categoryLabel} 표시사항 검토 결과</p>
            <h2 className={`text-2xl font-bold ${overall.color}`}>{overall.label}</h2>
            <p className="text-sm text-gray-600 mt-1">{result.summary}</p>
          </div>
          <button
            onClick={onReset}
            className="shrink-0 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            새로 검토
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          검토 일시: {new Date(result.checkedAt).toLocaleString('ko-KR')}
        </p>
      </div>

      {/* Items by priority */}
      {[
        { key: 'non_compliant' as const, title: '부적합 항목', subtitle: '즉시 수정이 필요합니다' },
        { key: 'needs_improvement' as const, title: '보완 필요 항목', subtitle: '내용 검토 및 보완을 권장합니다' },
        { key: 'not_found' as const, title: '미확인 항목', subtitle: '이미지에서 확인되지 않은 항목입니다' },
        { key: 'compliant' as const, title: '적합 항목', subtitle: '법령 요건을 충족합니다' },
        { key: 'not_applicable' as const, title: '해당 없음', subtitle: '본 제품에 적용되지 않는 항목입니다' },
      ].map(({ key, title, subtitle }) =>
        grouped[key].length > 0 ? (
          <section key={key}>
            <div className="mb-3">
              <h3 className="font-semibold text-gray-800">
                {STATUS_CONFIG[key].icon} {title}
                <span className="ml-2 text-sm font-normal text-gray-500">({grouped[key].length}건)</span>
              </h3>
              <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
            <div className="space-y-3">
              {grouped[key].map((item, idx) => (
                <CheckItemCard key={idx} item={item} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {/* OCR text */}
      <details className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-50 select-none">
          OCR 추출 텍스트 보기
        </summary>
        <div className="px-4 pb-4">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
            {result.ocrText}
          </pre>
        </div>
      </details>
    </div>
  )
}

function CheckItemCard({ item }: { item: CheckItem }) {
  const cfg = STATUS_CONFIG[item.status]
  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-800">{item.field}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {item.extractedValue && (
        <div className="text-sm">
          <span className="text-gray-500">추출된 내용: </span>
          <span className="font-mono bg-white rounded px-1">{item.extractedValue}</span>
        </div>
      )}

      <div className="text-sm text-gray-700">
        <span className="font-medium">법령 요건: </span>
        {item.requirement}
      </div>

      <div className={`text-sm ${cfg.color}`}>
        <span className="font-medium">판정: </span>
        {item.detail}
      </div>

      {item.legalBasis && (
        <div className="text-xs text-gray-400 border-t border-gray-200 pt-2">
          근거: {item.legalBasis}
        </div>
      )}
    </div>
  )
}
