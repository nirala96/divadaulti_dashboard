"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, MessageCircle } from "lucide-react"
import { copyText, openWhatsApp } from "@/lib/whatsapp"

export function WhatsAppNudgeButtons({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (await copyText(message)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openWhatsApp(message)}>
        <MessageCircle className="h-4 w-4 mr-1.5" />
        Send on WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
        {copied ? "Copied" : "Copy message"}
      </Button>
    </div>
  )
}
