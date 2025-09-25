import twilio from "twilio"
import { generateTutorReply } from "@/lib/ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const resp = new (twilio as any).twiml.MessagingResponse()
  resp.message("WhatsApp webhook is up.")
  return new Response(resp.toString(), { headers: { "Content-Type": "text/xml" }, status: 200 })
}

export async function POST(req: Request) {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!authToken) {
      const resp = new (twilio as any).twiml.MessagingResponse()
      resp.message("Server missing TWILIO_AUTH_TOKEN. Please contact the administrator.")
      return new Response(resp.toString(), { status: 200, headers: { "Content-Type": "text/xml" } })
    }

    // Read raw body for signature validation
    const raw = await req.text()
    const params = Object.fromEntries(new URLSearchParams(raw).entries()) as Record<string, string>

    // Reconstruct external URL when behind a proxy (ngrok/Vercel)
    const urlObj = new URL(req.url)
    const xfProto = req.headers.get("x-forwarded-proto") || urlObj.protocol.replace(":", "")
    const xfHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || urlObj.host
    const externalUrl = `${xfProto}://${xfHost}${urlObj.pathname}${urlObj.search}`

    const signature = req.headers.get("x-twilio-signature") || ""
    let valid = false
    try {
      valid = twilio.validateRequest(authToken, signature, externalUrl, params)
    } catch {
      valid = false
    }

    // In development, skip validation to ease local testing with tunnels
    const isDev = process.env.NODE_ENV !== "production"
    if (!valid && !isDev) {
      const resp = new (twilio as any).twiml.MessagingResponse()
      resp.message("Signature validation failed.")
      return new Response(resp.toString(), { status: 200, headers: { "Content-Type": "text/xml" } })
    }

    const userText = (params["Body"] || "").toString().trim()

    // Basic guard
    if (!userText) {
      const emptyResp = new (twilio as any).twiml.MessagingResponse()
      emptyResp.message("Hi! Please send a message to start chatting with EduThrive Tutor.")
      return new Response(emptyResp.toString(), { headers: { "Content-Type": "text/xml" } })
    }

    // Generate the tutor reply with a 10s timeout fallback
    const replyPromise = generateTutorReply({
      messages: [
        { sender: "user", content: userText },
      ],
    })

    const timeoutMs = Number(process.env.WHATSAPP_TIMEOUT_MS || 10000)
    const fallbackText = "Thanks! I’m thinking and will reply shortly."
    const timeoutPromise = new Promise<string>((resolve) => setTimeout(() => resolve("__FALLBACK__"), timeoutMs))

    const winner = await Promise.race([replyPromise, timeoutPromise])

    if (winner === "__FALLBACK__") {
      // Respond quickly to Twilio to avoid webhook timeout
      const quick = new (twilio as any).twiml.MessagingResponse()
      quick.message(fallbackText)

      // After responding, try to send the real reply via REST when ready
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const from = params["To"] // e.g., whatsapp:+14155238886
      const to = params["From"] // user's whatsapp:+...
      if (accountSid && authToken && from && to) {
        replyPromise
          .then((finalReply) => {
            if (!finalReply) return
            const client = twilio(accountSid, authToken)
            return client.messages.create({ from, to, body: finalReply })
          })
          .catch((e) => {
            console.error("Failed to send async WhatsApp reply:", e)
          })
      }

      return new Response(quick.toString(), { headers: { "Content-Type": "text/xml" }, status: 200 })
    }

    // We got the model reply in time; reply via TwiML
    const twiml = new (twilio as any).twiml.MessagingResponse()
    twiml.message(winner as string)
    return new Response(twiml.toString(), { headers: { "Content-Type": "text/xml" } })
  } catch (err: any) {
    console.error("/api/whatsapp error", err)
    const twiml = new (twilio as any).twiml.MessagingResponse()
    twiml.message("Sorry, something went wrong. Please try again later.")
    return new Response(twiml.toString(), { headers: { "Content-Type": "text/xml" }, status: 200 })
  }
}
