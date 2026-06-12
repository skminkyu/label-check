import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { LawContent, LawArticle } from '@/types'

const LAW_API_BASE = 'https://www.law.go.kr/DRF'
const OC = process.env.LAW_API_OC || ''

interface LawSearchResult {
  법령명한글: string
  법령ID: string
  현행연혁코드: string
}

async function searchLaw(lawName: string): Promise<string | null> {
  try {
    const res = await axios.get(`${LAW_API_BASE}/lawSearch.do`, {
      params: { OC, target: 'law', type: 'XML', query: lawName },
      timeout: 10000,
    })
    const parsed = await parseStringPromise(res.data)
    const items: LawSearchResult[] =
      parsed?.법령목록?.법령 || []
    const match = items.find((item) =>
      item.법령명한글?.[0]?.includes(lawName.replace(/\s/g, ''))
    ) || items[0]
    return match?.법령ID?.[0] || null
  } catch {
    return null
  }
}

async function fetchLawContent(lawId: string): Promise<LawContent | null> {
  try {
    const res = await axios.get(`${LAW_API_BASE}/lawService.do`, {
      params: { OC, target: 'law', ID: lawId, type: 'XML' },
      timeout: 15000,
    })
    const parsed = await parseStringPromise(res.data)
    const lawBody = parsed?.법령
    if (!lawBody) return null

    const lawName: string = lawBody.기본정보?.[0]?.법령명한글?.[0] || ''
    const articles: LawArticle[] = []

    const 조문들 = lawBody.조문?.flatMap((조: unknown) => {
      if (typeof 조 === 'object' && 조 !== null && '조문단위' in 조) {
        return (조 as { 조문단위: unknown[] }).조문단위
      }
      return []
    }) || []

    for (const 조 of 조문들) {
      if (typeof 조 !== 'object' || 조 === null) continue
      const 조obj = 조 as Record<string, unknown[]>
      const 조번호 = (조obj.조문번호?.[0] as string) || ''
      const 조제목 = (조obj.조문제목?.[0] as string) || ''
      const 조내용 = (조obj.조문내용?.[0] as string) || ''
      const 항목들 = 조obj.항 || []

      let fullContent = 조내용
      for (const 항 of 항목들) {
        if (typeof 항 !== 'object' || 항 === null) continue
        const 항obj = 항 as Record<string, unknown[]>
        fullContent += '\n' + ((항obj.항내용?.[0] as string) || '')
      }

      if (fullContent.trim()) {
        articles.push({ number: 조번호, title: 조제목, content: fullContent.trim() })
      }
    }

    return { name: lawName, articles }
  } catch {
    return null
  }
}

// Fetch key articles relevant to labeling from a law
export async function fetchLabelingLaw(lawName: string): Promise<string> {
  if (!OC) {
    return `[법령정보API 키 미설정 - ${lawName} 조회 불가]`
  }

  const lawId = await searchLaw(lawName)
  if (!lawId) {
    return `[${lawName}: 검색 결과 없음]`
  }

  const content = await fetchLawContent(lawId)
  if (!content) {
    return `[${lawName}: 내용 조회 실패]`
  }

  // Filter articles related to labeling
  const labelingKeywords = [
    '표시', '기재', '표기', '성분', '원산지', '유통기한', '사용기한',
    '내용량', '주의사항', '영양', '허가', '인증', '제조', '수입',
  ]
  const relevantArticles = content.articles.filter((a) =>
    labelingKeywords.some(
      (kw) => a.title.includes(kw) || a.content.includes(kw)
    )
  )

  const articlesToUse = relevantArticles.length > 0
    ? relevantArticles.slice(0, 20)
    : content.articles.slice(0, 15)

  if (articlesToUse.length === 0) {
    return `[${content.name}: 표시 관련 조항 없음]`
  }

  return (
    `=== ${content.name} ===\n` +
    articlesToUse
      .map((a) => `제${a.number}조 ${a.title}\n${a.content}`)
      .join('\n\n')
  )
}

export async function fetchAllLaws(lawNames: string[]): Promise<string> {
  // Fetch up to 4 laws in parallel to avoid timeout
  const subset = lawNames.slice(0, 4)
  const results = await Promise.all(subset.map(fetchLabelingLaw))
  return results.join('\n\n')
}
