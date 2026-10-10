export function SkuBadge({ sku, className = "" }: { sku?: string | null; className?: string }) {
  if (!sku) return null
  return (
    <span
      className={`inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-600 ${className}`}
      title="SKU"
    >
      {sku}
    </span>
  )
}
