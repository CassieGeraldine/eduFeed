import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages = [], subject } = await req.json()

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment." }, { status: 500 })
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash"

    const genAI = new GoogleGenerativeAI(apiKey)

    const guiderails = `You are EduThrive Tutor — a friendly, patient, curriculum-aligned AI tutor for primary and early-secondary students.
- Always be encouraging and respectful. Use simple, clear language appropriate to the student's grade.
- Prioritize step-by-step explanations, short examples, and practice questions with answers.
- If asked about real-world safety, medical, legal, financial, or self-harm topics, do not give instructions; instead follow escalation protocol and suggest a teacher or trusted adult.
- Do not ask for, store, or request personal identifying information from students. For voucher redemption require server-side confirmation and caregiver/teacher approval.
- If unsure about an answer, say "I might be mistaken" and offer a safe verification step or suggest asking a teacher.
${subject ? `- The subject is: ${subject}.` : ""}`

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: guiderails,
    })

    // Normalize messages array
    const sanitizedHistory: any[] = Array.isArray(messages) ? messages : []

    // Helper: build content parts from a message
    const buildParts = (m: any) => {
      const parts: any[] = []
      const text = typeof m?.content === "string" ? m.content : ""
      if (text && text.trim().length > 0) parts.push({ text })

      const imageData = m?.imageData
      if (
        imageData &&
        typeof imageData?.data === "string" &&
        imageData.data.length > 0 &&
        typeof imageData?.mimeType === "string" &&
        imageData.mimeType.length > 0
      ) {
        parts.push({ inlineData: { data: imageData.data, mimeType: imageData.mimeType } })
      }
      return parts
    }

    // Build history (exclude latest user turn)
    const mapped = sanitizedHistory
      .slice(0, -1)
      .filter((m) => m && (m.sender === "user" || m.sender === "ai"))
      .map((m) => {
        const role = m.sender === "user" ? "user" : "model"
        const parts = buildParts(m)
        // If AI turns have no parts, skip later
        return { role, parts }
      })
      .filter((h) => h.parts && h.parts.length > 0)

    // Gemini requires the first turn to be from the user. Drop leading model turns.
    let history = mapped
    if (history.length && history[0].role !== "user") {
      const firstUserIdx = history.findIndex((h) => h.role === "user")
      history = firstUserIdx === -1 ? [] : history.slice(firstUserIdx)
    }

    // Latest user turn
    const last = sanitizedHistory[sanitizedHistory.length - 1] || {}
    const lastParts = buildParts(last)

    const chat = model.startChat({ history })

    // Send message with multimodal support
    const result = await chat.sendMessage(
      lastParts.length > 0 ? lastParts : [{ text: "" }],
    )

    const text = result.response.text()
    return NextResponse.json({ text })
  } catch (err: any) {
    console.error("/api/chat error", err)
    const message = (err && (err.message || err.toString())) || "Failed to fetch response from Gemini."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
