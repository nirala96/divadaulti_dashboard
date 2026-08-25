"use client"

import { getMerchandiserColor } from "@/lib/merchandiserColors"

interface MerchandiserTagProps {
  name: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function MerchandiserTag({ name, className = "", onClick }: MerchandiserTagProps) {
  const color = getMerchandiserColor(name)
  const Tag = onClick ? "button" : "span"

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color.bg} ${color.text} ${color.border} ${onClick ? "hover:opacity-80 transition-opacity cursor-pointer" : ""} ${className}`}
      title={onClick ? `Merchandiser: ${name} (click to change)` : `Merchandiser: ${name}`}
    >
      {name}
    </Tag>
  )
}
