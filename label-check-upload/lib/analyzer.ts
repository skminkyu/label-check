import Anthropic from '@anthropic-ai/sdk'
import { CheckResult, CheckItem, ProductCategory } from '@/types'
import { getCategoryInfo } from './categories'
import { fetchAllLaws } from './lawApi'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeLabel(
  category: ProductCategory,
  imageBase64: string,
  mimeType: string
): Promise<CheckResult> {
  const categoryInfo = getCategoryInfo(category)
  if (!categoryInfo) throw new Error('Unknown category')

  // Step 1: OCR
  const ocrText = await extractTextFromImage(imageBase64, mimeType)

  // Step 2: Fetch relevant laws
  const lawNames = categoryInfo.laws.map((l) => l.name)
  const lawContent = await fetchAllLaws(lawNames)

  // Step 3: Analyze compliance
  const items = await checkCompliance(ocrText, categoryInfo, lawContent)

  const nonCompliantCount = items.filter((i) => i.status === 'non_compliant').length
  const needsImprovementCount = items.filter((i) => i.status === 'needs_improvement').length
  const notFoundCount = items.filter((i) => i.status === 'not_found').length

  let overallStatus: CheckResult['overallStatus']
  if (nonCompliantCount > 0 || notFoundCount > 2) {
    overallStatus = 'non_compliant'
  } else if (needsImprovementCount > 0 || notFoundCount > 0) {
    overallStatus = 'needs_improvement'
  } else {
    overallStatus = 'compliant'
  }

  const compliantCount = items.filter((i) => i.status === 'compliant').length
  const summary =
    `총 ${items.length}개 항목 검토: 적합 ${compliantCount}건, ` +
    `보완필요 ${needsImprovementCount}건, 부적합 ${nonCompliantCount}건, ` +
    `미확인 ${notFoundCount}건`

  return {
    category,
    categoryLabel: categoryInfo.label,
    overallStatus,
    summary,
    items,
    ocrText,
    checkedAt: new Date().toISOString(),
  }
}

async function extractTextFromImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
  type ValidMimeType = typeof validMimeTypes[number]

  const safeMime: ValidMimeType = validMimeTypes.includes(mimeType as ValidMimeType)
    ? (mimeType as ValidMimeType)
    : 'image/jpeg'

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: safeMime, data: imageBase64 },
          },
          {
            type: 'text',
            text: `이 이미지는 제품 표시사항(라벨)입니다. 이미지에서 모든 텍스트를 빠짐없이 추출하여 원문 그대로 전달해 주세요.
텍스트가 한국어, 영어, 또는 혼재되어 있어도 모두 포함하세요.
글자 크기가 작거나 희미한 부분도 최대한 읽어주세요.
레이아웃(줄바꿈, 구분선 등)을 최대한 유지하여 추출해 주세요.`,
          },
        ],
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function checkCompliance(
  ocrText: string,
  categoryInfo: ReturnType<typeof getCategoryInfo>,
  lawContent: string
): Promise<CheckItem[]> {
  if (!categoryInfo) return []

  const prompt = `당신은 한국 제품 표시사항 규정 전문가입니다.

## 제품 카테고리
${categoryInfo.label}

## 관련 법령 (요약)
${lawContent.slice(0, 12000)}

## 표시사항 OCR 추출 텍스트
\`\`\`
${ocrText}
\`\`\`

## 검토 필수 항목
${categoryInfo.requiredFields.map((f, i) => `${i + 1}. ${f}`).join('\n')}

위 법령 기준에 따라 OCR로 추출된 표시사항을 항목별로 검토해 주세요.

반드시 다음 JSON 배열 형식으로만 응답하세요 (설명 텍스트 없이 JSON만):
[
  {
    "field": "항목명",
    "status": "compliant|non_compliant|needs_improvement|not_applicable|not_found",
    "extractedValue": "OCR에서 찾은 실제 값 (없으면 null)",
    "requirement": "법령상 요구사항 요약",
    "detail": "판정 이유 및 구체적 설명",
    "legalBasis": "근거 법령명 및 조항"
  }
]

status 기준:
- compliant: 법령 요건 충족
- non_compliant: 법령 요건 명백히 미충족
- needs_improvement: 기재되었으나 형식·내용 보완 필요
- not_found: OCR 텍스트에서 해당 항목을 찾을 수 없음
- not_applicable: 해당 제품에 적용 불필요한 항목`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as CheckItem[]
  } catch {
    return []
  }
}
