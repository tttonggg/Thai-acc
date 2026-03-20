'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, X, Menu } from 'lucide-react'

// Mobile touch target minimum 44px
const TOUCH_TARGET_SIZE = 'min-h-[44px] min-w-[44px]'

export interface MobileFormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
  className?: string
}

export function MobileFormField({
  label,
  children,
  error,
  required,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className={TOUCH_TARGET_SIZE}>
        {children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// Touch-friendly input with larger touch target
export function TouchInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      className={cn(
        TOUCH_TARGET_SIZE,
        'text-base', // Prevent zoom on iOS
        className
      )}
      style={{ fontSize: '16px' }} // iOS zoom prevention
      {...props}
    />
  )
}

// Mobile bottom sheet for dialogs on mobile devices
export interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  showHandle?: boolean
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showHandle = true,
}: MobileBottomSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-h-[90vh] p-0">
        {showHandle && (
          <div className="w-full flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        <SheetHeader className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={TOUCH_TARGET_SIZE}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Swipeable list item for mobile using native touch events
export interface SwipeableListItemProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: { icon: React.ReactNode; label: string; color: string }
  rightAction?: { icon: React.ReactNode; label: string; color: string }
  className?: string
}

export function SwipeableListItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
}: SwipeableListItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const startX = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - startX.current
    
    // Limit swipe distance
    const maxSwipe = 100
    if (deltaX > 0 && onSwipeRight) {
      setSwipeOffset(Math.min(deltaX, maxSwipe))
    } else if (deltaX < 0 && onSwipeLeft) {
      setSwipeOffset(Math.max(deltaX, -maxSwipe))
    }
  }, [onSwipeLeft, onSwipeRight])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    const threshold = 80
    if (swipeOffset > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (swipeOffset < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    setSwipeOffset(0)
  }, [swipeOffset, onSwipeLeft, onSwipeRight])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {leftAction && (
          <div
            className={cn(
              'flex-1 flex items-center px-4 transition-opacity',
              leftAction.color,
              swipeOffset <= 0 && 'opacity-0'
            )}
            style={{ opacity: swipeOffset > 0 ? swipeOffset / 100 : 0 }}
          >
            {leftAction.icon}
            <span className="ml-2 text-white font-medium">{leftAction.label}</span>
          </div>
        )}
        <div className="flex-1" />
        {rightAction && (
          <div
            className={cn(
              'flex-1 flex items-center justify-end px-4 transition-opacity',
              rightAction.color,
              swipeOffset >= 0 && 'opacity-0'
            )}
            style={{ opacity: swipeOffset < 0 ? Math.abs(swipeOffset) / 100 : 0 }}
          >
            <span className="mr-2 text-white font-medium">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className="relative bg-background transition-transform duration-100 touch-pan-y"
      >
        {children}
      </div>
    </div>
  )
}

// Mobile navigation drawer
export interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  items: { id: string; label: string; icon?: React.ReactNode; onClick: () => void }[]
}

export function MobileNavDrawer({ isOpen, onClose, title, items }: MobileNavDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </SheetHeader>
        <nav className="p-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left',
                'hover:bg-muted active:bg-muted/80 transition-colors',
                TOUCH_TARGET_SIZE
              )}
            >
              {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

// Mobile-optimized data table (card view for mobile)
export interface MobileDataListProps<T> {
  data: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  onItemClick?: (item: T) => void
  emptyMessage?: string
  className?: string
}

export function MobileDataList<T>({
  data,
  keyExtractor,
  renderItem,
  onItemClick,
  emptyMessage = 'ไม่พบข้อมูล',
  className,
}: MobileDataListProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {data.map((item) => (
        <div
          key={keyExtractor(item)}
          onClick={() => onItemClick?.(item)}
          className={cn(
            'p-4 bg-card rounded-lg border',
            onItemClick && 'active:bg-muted cursor-pointer',
            TOUCH_TARGET_SIZE
          )}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}

// Mobile stepper for multi-step forms
export interface MobileStepperProps {
  steps: { id: string; label: string }[]
  currentStep: number
  onStepClick?: (index: number) => void
  className?: string
}

export function MobileStepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: MobileStepperProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3', className)}>
      <button
        onClick={() => onStepClick?.(currentStep - 1)}
        disabled={currentStep === 0}
        className={cn(
          'p-2 rounded-full',
          currentStep > 0 ? 'hover:bg-muted' : 'opacity-30'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 mx-4">
        <div className="text-center">
          <span className="text-sm font-medium">
            ขั้นตอน {currentStep + 1} จาก {steps.length}
          </span>
          <p className="text-xs text-muted-foreground">{steps[currentStep]?.label}</p>
        </div>
        <div className="flex gap-1 mt-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                idx <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => onStepClick?.(currentStep + 1)}
        disabled={currentStep === steps.length - 1}
        className={cn(
          'p-2 rounded-full',
          currentStep < steps.length - 1 ? 'hover:bg-muted' : 'opacity-30'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// Detect if device is mobile using media query
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check initially
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

// Responsive container that adapts to mobile/desktop
export interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  mobileClassName?: string
  desktopClassName?: string
}

export function ResponsiveContainer({
  children,
  className,
  mobileClassName,
  desktopClassName,
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile()

  return (
    <div
      className={cn(
        className,
        isMobile ? mobileClassName : desktopClassName
      )}
    >
      {children}
    </div>
  )
}

// Mobile floating action button
export interface MobileFabProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  className?: string
}

export function MobileFab({ onClick, icon, label, className }: MobileFabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-14 h-14 rounded-full bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all hover:scale-105 active:scale-95',
        className
      )}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

// Mobile search bar with larger touch targets
export interface MobileSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSubmit?: () => void
  className?: string
}

export function MobileSearchBar({
  value,
  onChange,
  placeholder = 'ค้นหา...',
  onSubmit,
  className,
}: MobileSearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        className={cn(
          'w-full h-12 px-4 pr-12',
          'text-base rounded-lg border border-input',
          'bg-background',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          'placeholder:text-muted-foreground'
        )}
        style={{ fontSize: '16px' }} // Prevent iOS zoom
      />
      <button
        onClick={onSubmit}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2',
          'w-8 h-8 flex items-center justify-center',
          'text-muted-foreground hover:text-foreground'
        )}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  )
}
