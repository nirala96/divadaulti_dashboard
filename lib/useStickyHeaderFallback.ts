"use client"

import { useEffect, type RefObject } from "react"

// Backup for browsers where the sticky table header doesn't pin (older
// iPad Safari). On every scroll it checks where the header cells actually
// are: if CSS sticky is working they're already at the top and nothing
// happens; if they've scrolled away with the table, it shifts them down
// with a transform so they stay at the top of the visible area.
// Pass `ready` = true once the table is actually rendered (after loading).
export function useStickyHeaderFallback(tableRef: RefObject<HTMLTableElement>, ready: boolean) {
  useEffect(() => {
    const table = tableRef.current
    if (!table) return
    const scroller = table.closest("main") as HTMLElement | null
    let frame = 0
    let offset = 0

    const update = () => {
      frame = 0
      const cells = Array.from(table.querySelectorAll<HTMLElement>("thead th"))
      if (cells.length === 0) return
      const tableRect = table.getBoundingClientRect()
      const headTop = cells[0].getBoundingClientRect().top - offset // where sticky alone put it
      const visibleTop = Math.max(scroller ? scroller.getBoundingClientRect().top : 0, 0)
      const headHeight = cells[0].offsetHeight

      const stickyFailed = headTop <= tableRect.top + 1 && tableRect.top < visibleTop
      const next = stickyFailed
        ? Math.max(0, Math.min(visibleTop - tableRect.top, tableRect.height - headHeight))
        : 0
      if (Math.abs(next - offset) < 0.5) return
      offset = next
      for (const cell of cells) {
        if (offset) {
          // Lift the moved cells above row content (images, stage dots).
          cell.style.setProperty("position", "relative", "important")
          cell.style.setProperty("z-index", "40", "important")
          cell.style.setProperty("top", "0", "important")
          cell.style.transform = `translateY(${offset}px)`
        } else {
          cell.style.removeProperty("position")
          cell.style.removeProperty("z-index")
          cell.style.removeProperty("top")
          cell.style.transform = ""
        }
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const target: HTMLElement | Window = scroller || window
    target.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()
    return () => {
      target.removeEventListener("scroll", onScroll)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [tableRef, ready])
}
