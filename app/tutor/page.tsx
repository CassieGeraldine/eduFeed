"use client"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Camera,
  ImageIcon,
  BookOpen,
  Calculator,
  Beaker,
  Lightbulb,
  Clock,
  Star,
  MessageCircle,
} from "lucide-react"

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type?: "text" | "image" | "voice"
  subject?: string
  // Base64 image data and mime type to send to API
  imageData?: { data: string; mimeType: string; name?: string }
  // Local preview URL (data URL or object URL) for rendering
  imageUrl?: string
}

const quickHelp = [
  { text: "Help with math homework", icon: Calculator, subject: "Mathematics" },
  { text: "Explain a science concept", icon: Beaker, subject: "Science" },
  { text: "Reading comprehension help", icon: BookOpen, subject: "Reading" },
  { text: "Study tips and techniques", icon: Lightbulb, subject: "Study Skills" },
]

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI tutor, here to help you learn and grow. What can I help you with today?",
      sender: "ai",
      timestamp: new Date(),
      type: "text",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // File inputs for image upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

  // Call our API route backed by Gemini
  const requestAIReply = async (fullConversation: Message[], subject?: string): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: fullConversation, subject }),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => "")
      throw new Error(msg || "Failed to reach AI service")
    }
    const data = (await res.json()) as { text?: string; error?: string }
    if (data.error) throw new Error(data.error)
    return data.text || "I'm sorry, I couldn't generate a response."
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    }

    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInputMessage("")
    setIsTyping(true)

    try {
      const text = await requestAIReply(nextMessages)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (e: any) {
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: `Error: ${e?.message || "Unable to get response right now."}`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickHelp = async (helpText: string, subject: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: helpText,
      sender: "user",
      timestamp: new Date(),
      type: "text",
      subject,
    }

    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setIsTyping(true)

    try {
      const text = await requestAIReply(nextMessages, subject)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        subject,
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (e: any) {
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: `Error: ${e?.message || "Unable to get response right now."}`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
        subject,
      }
      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Mock voice recording functionality
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false)
        setInputMessage("Can you help me with fractions?")
      }, 3000)
    }
  }

  // Handle selected image files
  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    // Limit size to ~2MB to keep request manageable
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      const warning: Message = {
        id: (Date.now() + 3).toString(),
        content: "Image is too large. Please select an image under 2MB.",
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, warning])
      return
    }

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Extract base64 data and mime
    const [prefix, base64] = dataUrl.split(",")
    const mimeMatch = /^data:(.*?);base64$/.exec(prefix || "")
    const mimeType = mimeMatch?.[1] || file.type || "image/*"

    const imageMessage: Message = {
      id: Date.now().toString(),
      content: "", // optional caption can be added via input in the future
      sender: "user",
      timestamp: new Date(),
      type: "image",
      imageUrl: dataUrl,
      imageData: { data: base64 || "", mimeType, name: file.name },
    }

    const nextMessages = [...messages, imageMessage]
    setMessages(nextMessages)
    setIsTyping(true)

    try {
      const text = await requestAIReply(nextMessages)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (e: any) {
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: `Error: ${e?.message || "Unable to get response right now."}`,
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      }
      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="md:ml-64 pt-20 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">AI Tutor</h1>
                <p className="text-muted-foreground">Your personal learning assistant</p>
              </div>
            </div>
          </div>

          {/* Quick Help */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Quick Help</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickHelp.map((help, index) => {
                const Icon = help.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickHelp(help.text, help.subject)}
                    className="flex items-center gap-2 h-auto p-3 text-left justify-start"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs">{help.text}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Chat Interface */}
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Chat with AI Tutor
                <Badge variant="secondary" className="ml-auto">
                  <div className="w-2 h-2 bg-accent rounded-full mr-1 animate-pulse" />
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "ai" && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 overflow-hidden ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {/* Render image if present */}
                        {message.type === "image" && message.imageUrl ? (
                          <div className="mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={message.imageUrl}
                              alt={message.imageData?.name || "Uploaded image"}
                              className="rounded-md max-h-64 w-auto object-contain"
                            />
                          </div>
                        ) : null}
                        {message.content ? (
                          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                        ) : null}
                        {message.subject && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {message.subject}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          <span suppressHydrationWarning>
                            {timeFormatter.format(new Date(message.timestamp))}
                          </span>
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">A</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted text-muted-foreground rounded-lg p-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-current rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRecording}
                    className={isRecording ? "bg-destructive text-destructive-foreground" : ""}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your studies..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>

                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
                {isRecording && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    Recording... Speak now
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-secondary mx-auto mb-2" />
                <h4 className="font-semibold mb-1">24/7 Available</h4>
                <p className="text-sm text-muted-foreground">Get help anytime, anywhere</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Lightbulb className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Personalized Help</h4>
                <p className="text-sm text-muted-foreground">Tailored to your learning style</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-1">All Subjects</h4>
                <p className="text-sm text-muted-foreground">Math, Science, Reading & more</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
