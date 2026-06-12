import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '제품 표시사항 적합성 검토 시스템',
  description: '화장품, 식품, 의약외품 등 제품 표시사항의 법령 적합성을 AI로 검토합니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  )
}
