'use client'

import { CATEGORIES } from '@/lib/categories'
import { ProductCategory } from '@/types'

const CATEGORY_ICONS: Record<ProductCategory, string> = {
  cosmetics: '💄',
  food: '🍱',
  food_utensil: '🍽️',
  quasi_drug: '💊',
  household_chemical: '🧴',
  electrical: '⚡',
  medical_device: '🏥',
}

interface Props {
  selected: ProductCategory | null
  onSelect: (cat: ProductCategory) => void
}

export default function CategorySelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
            ${
              selected === cat.id
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            }`}
        >
          <span className="text-3xl">{CATEGORY_ICONS[cat.id]}</span>
          <span className="text-center leading-tight">{cat.label}</span>
        </button>
      ))}
    </div>
  )
}
