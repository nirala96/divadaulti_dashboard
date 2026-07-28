"use client"

import { useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImagePreviewDialogProps {
  imageUrl: string | null
  onClose: () => void
}

export function ImagePreviewDialog({ imageUrl, onClose }: ImagePreviewDialogProps) {
  // A plain React-state modal has no history entry of its own, so on a
  // mobile/PWA install the Android back button falls through to the
  // underlying page history and exits the app instead of closing this
  // dialog. Pushing a dummy history entry while open, then treating any
  // close action as "go back", makes back/gesture-nav close the modal.
  useEffect(() => {
    if (!imageUrl) return
    window.history.pushState({ modal: 'image-preview' }, '')
    const handlePopState = () => onClose()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  const closeViaHistory = () => {
    if (imageUrl) window.history.back()
  }

  return (
    <Dialog open={!!imageUrl} onOpenChange={closeViaHistory}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Design Image</DialogTitle>
        </DialogHeader>
        {imageUrl && (
          <div
            className="relative w-full h-[70vh] max-h-[600px] cursor-pointer"
            onClick={closeViaHistory}
            title="Tap to close"
          >
            <Image
              src={imageUrl}
              alt="Design preview"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
              unoptimized
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
