'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, File, X, FileText, FileSpreadsheet, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  onFileSelect: (files: File[]) => void
  label?: string
  description?: string
  className?: string
  uploadedFileName?: string
  onClear?: () => void
}

export function FileUpload({
  accept = '*',
  multiple = false,
  maxSize = 5,
  onFileSelect,
  label = 'อัปโหลดไฟล์',
  description = 'คลิกหรือลากไฟล์มาวางที่นี่',
  className,
  uploadedFileName,
  onClear
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-8 w-8 text-red-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const validateFiles = useCallback((files: File[]): boolean => {
    const maxSizeBytes = maxSize * 1024 * 1024
    
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        setError(`ไฟล์ "${file.name}" มีขนาดใหญ่เกิน ${maxSize}MB`)
        return false
      }
    }
    
    setError(null)
    return true
  }, [maxSize])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    
    if (validateFiles(fileArray)) {
      setSelectedFiles(fileArray)
      onFileSelect(fileArray)
    }
  }, [validateFiles, onFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    if (newFiles.length === 0) {
      onFileSelect([])
    }
  }

  const clearAll = () => {
    setSelectedFiles([])
    setError(null)
    if (onClear) onClear()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Show uploaded file name if provided
  if (uploadedFileName && selectedFiles.length === 0) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700">{uploadedFileName}</span>
        </div>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
          isDragging 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
          error && "border-red-300 bg-red-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        
        {selectedFiles.length > 0 ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-center gap-2">
                {getFileIcon(file.type)}
                <span className="text-sm text-gray-600">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={clearAll} className="mt-2">
              ล้างไฟล์
            </Button>
          </div>
        ) : (
          <>
            <Upload className={cn(
              "h-10 w-10 mx-auto mb-3",
              isDragging ? "text-blue-500" : "text-gray-400"
            )} />
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
            <p className="text-xs text-gray-400 mt-2">ขนาดสูงสุด {maxSize}MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}
