'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  onImageReady: (base64: string, mimeType: string, preview: string) => void
}

export default function ImageUploader({ onImageReady }: Props) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.split(',')[1]
        const mimeType = file.type || 'image/jpeg'
        setPreview(dataUrl)
        onImageReady(base64, mimeType, dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [onImageReady]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isDragActive ? (
            <p className="text-blue-600 font-medium">여기에 놓으세요!</p>
          ) : (
            <>
              <p className="font-medium">표시사항 이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-sm">JPG, PNG, WEBP, GIF · 최대 20MB</p>
            </>
          )}
        </div>
      </div>

      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
          <img src={preview} alt="업로드된 표시사항" className="max-h-80 w-full object-contain p-2" />
          <button
            onClick={(e) => { e.stopPropagation(); setPreview(null); onImageReady('', '', '') }}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-opacity-80"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
