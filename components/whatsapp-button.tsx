"use client"
import React from "react"

// Simple floating WhatsApp button. Reads number from NEXT_PUBLIC_WHATSAPP_NUMBER
// and opens wa.me link in a new tab.
export function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "14155238886"
  // Strip non-digits just in case
  const sanitized = number.replace(/\D/g, "")
  if (!sanitized) return null

  // Prefer Twilio Sandbox join flow when configured
  const isSandboxForced = String(process.env.NEXT_PUBLIC_WHATSAPP_IS_SANDBOX || "").toLowerCase() === "true"
  const isSandboxNumber = sanitized === "14155238886"
  const joinCode = process.env.NEXT_PUBLIC_WHATSAPP_JOIN_CODE || ""

  const defaultPrefill = process.env.NEXT_PUBLIC_WHATSAPP_PREFILL_TEXT ||
    "Hi! I want to chat with mwanAfrika Tutor."

  const prefill = (isSandboxForced || isSandboxNumber) && joinCode
    ? `join ${joinCode}`
    : defaultPrefill

  const href = `https://wa.me/${sanitized}?text=${encodeURIComponent(prefill)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-4 right-4 z-50"
    >
      <div
        className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
        style={{ backgroundColor: "#25D366" }}
      >
        {/* Minimal WhatsApp icon (inline SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="28"
          height="28"
          aria-hidden
        >
          <path fill="#fff" d="M19.11 17.31c-.3-.15-1.77-.87-2.05-.97-.28-.1-.49-.15-.7.15-.2.3-.8.97-.98 1.17-.18.2-.36.22-.66.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.53-.07-.15-.7-1.7-.96-2.33-.25-.6-.5-.5-.7-.5-.18-.01-.37-.01-.57-.01-.2 0-.53.08-.81.37-.28.3-1.07 1.05-1.07 2.56 0 1.5 1.1 2.96 1.26 3.17.15.2 2.17 3.32 5.25 4.65.73.32 1.3.52 1.75.66.74.23 1.41.2 1.94.12.59-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.35zM13.93 5.33c-4.86 0-8.8 3.94-8.8 8.8 0 1.74.51 3.36 1.39 4.72L5 27l8.34-1.47c1.3.71 2.8 1.12 4.4 1.12 4.86 0 8.8-3.94 8.8-8.8s-3.94-8.52-8.6-8.52h-.01c-.31-.02-.62-.03-.94-.03zm0 2.27c.28 0 .56.01.83.03h.04c3.65.02 6.61 3.01 6.61 6.67 0 3.68-2.99 6.67-6.67 6.67-1.27 0-2.46-.36-3.46-.98l-.25-.15-4.95.88.92-4.82-.16-.25c-.73-1.11-1.16-2.44-1.16-3.86 0-3.68 2.99-6.67 6.67-6.67z"/>
        </svg>
      </div>
    </a>
  )
}
