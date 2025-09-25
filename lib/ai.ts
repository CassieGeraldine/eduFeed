import { GoogleGenerativeAI } from "@google/generative-ai"

export type TutorMessage = {
  sender: "user" | "ai"
  content?: string
  imageData?: { data: string; mimeType: string }
}

export async function generateTutorReply({
  messages = [],
  subject,
}: {
  messages: TutorMessage[]
  subject?: string
}): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment.")

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash"
  const genAI = new GoogleGenerativeAI(apiKey)

  const guiderails = `You are mwanAfrika Tutor — a friendly, patient, curriculum-aligned AI tutor for primary and early-secondary students.
- Always be encouraging and respectful. Use simple, clear language appropriate to the student's grade.
- Prioritize step-by-step explanations, short examples, and practice questions with answers.
- If asked about real-world safety, medical, legal, financial, or self-harm topics, do not give instructions; instead follow escalation protocol and suggest a teacher or trusted adult.
- Do not ask for, store, or request personal identifying information from students. For voucher redemption require server-side confirmation and caregiver/teacher approval.
- If unsure about an answer, say "I might be mistaken" and offer a safe verification step or suggest asking a teacher.
${subject ? `- The subject is: ${subject}.` : ""}`

  const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: guiderails })

  const buildParts = (m: TutorMessage) => {
    const parts: any[] = []
    const text = typeof m?.content === "string" ? m.content : ""
    if (text && text.trim().length > 0) parts.push({ text })
    const imageData = (m as any)?.imageData
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

  const sanitizedHistory: TutorMessage[] = Array.isArray(messages) ? messages : []
  const mapped = sanitizedHistory
    .slice(0, -1)
    .filter((m) => m && (m.sender === "user" || m.sender === "ai"))
    .map((m) => {
      const role = m.sender === "user" ? "user" : "model"
      const parts = buildParts(m)
      return { role, parts }
    })
    .filter((h) => (h as any).parts && (h as any).parts.length > 0)

  let history = mapped as any
  if (history.length && history[0].role !== "user") {
    const firstUserIdx = history.findIndex((h: any) => h.role === "user")
    history = firstUserIdx === -1 ? [] : history.slice(firstUserIdx)
  }

  const last = sanitizedHistory[sanitizedHistory.length - 1] || ({ sender: "user", content: "" } as TutorMessage)
  const lastParts = buildParts(last)
  const chat = model.startChat({ history })
  const result = await chat.sendMessage(lastParts.length > 0 ? lastParts : [{ text: "" }])
  const text = result.response.text()
  return text
}
