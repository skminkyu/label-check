export type ProductCategory =
  | 'cosmetics'
  | 'food'
  | 'food_utensil'
  | 'quasi_drug'
  | 'household_chemical'
  | 'electrical'
  | 'medical_device'

export interface CategoryInfo {
  id: ProductCategory
  label: string
  laws: LawReference[]
  requiredFields: string[]
}

export interface LawReference {
  name: string
  lawId?: string
  type: 'law' | 'ordinance' | 'regulation' | 'notice'
}

export interface OcrResult {
  text: string
  sections: Record<string, string>
}

export interface LawContent {
  name: string
  articles: LawArticle[]
}

export interface LawArticle {
  number: string
  title: string
  content: string
}

export interface CheckItem {
  field: string
  status: 'compliant' | 'non_compliant' | 'needs_improvement' | 'not_applicable' | 'not_found'
  extractedValue?: string
  requirement: string
  detail: string
  legalBasis: string
}

export interface CheckResult {
  category: ProductCategory
  categoryLabel: string
  overallStatus: 'compliant' | 'non_compliant' | 'needs_improvement'
  summary: string
  items: CheckItem[]
  ocrText: string
  checkedAt: string
}

export interface CheckRequest {
  category: ProductCategory
  imageBase64: string
  mimeType: string
}
