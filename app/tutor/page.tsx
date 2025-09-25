"use client"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
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
  Volume2,
  StopCircle,
} from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type?: "text" | "image" | "voice"
  subject?: string
}

const quickHelp = [
  { text: "Help with math homework", icon: Calculator, subject: "Mathematics" },
  { text: "Explain a science concept", icon: Beaker, subject: "Science" },
  { text: "Reading comprehension help", icon: BookOpen, subject: "Reading" },
  { text: "Study tips and techniques", icon: Lightbulb, subject: "Study Skills" },
]

export default function AITutor() {
  const { toast } = useToast()
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Speech Recognition refs/state
  const recognitionRef = useRef<any>(null)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)

  // Speech Synthesis (TTS)
  const [isTtsSupported, setIsTtsSupported] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Feature-detect SpeechRecognition once on mount (client-only)
    const SpeechRecognition =
      typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    setIsSpeechSupported(!!SpeechRecognition)

    // Detect speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis
      setIsTtsSupported(true)
    }

    return () => {
      // Cleanup recognition on unmount
      try {
        recognitionRef.current?.stop?.()
      } catch {}
      recognitionRef.current = null
      setIsRecording(false)

      // Stop any ongoing speech
      try {
        synthRef.current?.cancel()
      } catch {}
      utteranceRef.current = null
      setSpeakingId(null)
    }
  }, [])

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

  // Real speech recognition handlers
  const startRecording = () => {
    const SpeechRecognition = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) as any
    if (!SpeechRecognition) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition.",
      })
      return
    }
    if (recognitionRef.current) {
      // Already running
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = (typeof navigator !== "undefined" && (navigator as any).language) || "en-US"
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      let finalTranscript = ""

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: any) => {
        let interim = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) finalTranscript += res[0].transcript
          else interim += res[0].transcript
        }
        const combined = `${finalTranscript} ${interim}`.trim()
        setInputMessage(combined)
      }

      recognition.onerror = (e: any) => {
        setIsRecording(false)
        recognitionRef.current = null
        const err = e?.error || "Recognition failed"
        // silence 'no-speech' as it's common when user cancels quickly
        if (err !== "no-speech") {
          toast({ title: "Voice error", description: String(err) })
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
        recognitionRef.current = null
        setInputMessage((prev) => prev.trim())
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e: any) {
      setIsRecording(false)
      recognitionRef.current = null
      toast({ title: "Voice error", description: e?.message || "Unable to start microphone." })
    }
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop?.()
    } catch {}
    recognitionRef.current = null
    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (!isSpeechSupported) {
      toast({ title: "Voice not supported", description: "Try Chrome on desktop or Android." })
      return
    }
    if (isRecording) stopRecording()
    else startRecording()
  }

  // TTS controls
  const speakText = (id: string, text: string) => {
    if (!isTtsSupported || !text.trim()) return
    try {
      synthRef.current?.cancel()
    } catch {}

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = (typeof navigator !== "undefined" && (navigator as any).language) || "en-US"
    utter.onstart = () => setSpeakingId(id)
    utter.onend = () => {
      setSpeakingId(null)
      utteranceRef.current = null
    }
    utter.onerror = () => {
      setSpeakingId(null)
      utteranceRef.current = null
      toast({ title: "Voice playback error", description: "Unable to play audio." })
    }
    utteranceRef.current = utter

    try {
      synthRef.current?.speak(utter)
    } catch (e: any) {
      toast({ title: "Voice playback error", description: e?.message || "Playback failed." })
    }
  }

  const stopSpeaking = () => {
    try {
      synthRef.current?.cancel()
    } catch {}
    utteranceRef.current = null
    setSpeakingId(null)
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
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.subject && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {message.subject}
                          </Badge>
                        )}
                        {/* TTS controls for AI messages */}
                        {message.sender === "ai" && isTtsSupported && message.content && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                speakingId === message.id
                                  ? stopSpeaking()
                                  : speakText(message.id, message.content)
                              }
                            >
                              {speakingId === message.id ? (
                                <>
                                  <StopCircle className="h-4 w-4 mr-2" /> Stop
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-4 w-4 mr-2" /> Listen
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          <span>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRecording}
                    className={isRecording ? "bg-destructive text-destructive-foreground" : ""}
                    disabled={!isSpeechSupported && !isRecording}
                    title={isSpeechSupported ? undefined : "Speech recognition not supported"}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your studies..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
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
