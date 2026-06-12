import { NextRequest, NextResponse } from 'next/server'
import { analyzeLabel } from '@/lib/analyzer'
import { CheckRequest } from '@/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const body: CheckRequest = await request.json()
    const { category, imageBase64, mimeType } = body

    if (!category || !imageBase64 || !mimeType) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const result = await analyzeLabel(category, imageBase64, mimeType)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
