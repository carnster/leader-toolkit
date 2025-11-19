import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAICopilot } from "@/hooks/useAICopilot";
import { useLocation } from "react-router-dom";

interface AICopilotProps {
  initiativeId?: string;
  context?: any;
}

export function AICopilot({ initiativeId, context }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const {
    messages,
    currentConversationId,
    isStreaming,
    loadingMessages,
    conversations,
    createConversation,
    sendMessage,
    setCurrentConversationId,
    stopStreaming,
  } = useAICopilot(initiativeId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  // Build context from current page and data
  const buildContext = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const currentPage = pathParts[0] || 'dashboard';
    
    return {
      currentPage,
      currentStage: pathParts[0],
      initiative: context?.initiative,
      teamSize: context?.teamSize,
      activeIngredients: context?.activeIngredients,
      milestones: context?.milestones,
      fidelityScore: context?.fidelityScore,
      recentActivity: context?.recentActivity,
    };
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue;
    setInputValue("");
    setStreamingMessage("");

    await sendMessage(
      userMessage,
      buildContext(),
      (delta) => {
        setStreamingMessage(prev => prev + delta);
      }
    );

    setStreamingMessage("");
  };

  const handleNewConversation = () => {
    setStreamingMessage("");
    createConversation();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all z-50",
          "bg-primary hover:bg-primary/90 text-white",
          isOpen && "scale-0"
        )}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 h-[600px] w-[400px] bg-background border-l border-t shadow-2xl transition-transform duration-300 z-50 rounded-tl-lg",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Copilot</h3>
              <p className="text-xs text-muted-foreground">Your implementation assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[calc(100%-140px)] p-4" ref={scrollRef}>
          {!currentConversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Welcome to AI Copilot</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  I'm here to help you with implementation guidance, answer questions, and provide insights.
                </p>
              </div>
              <Button onClick={handleNewConversation} className="w-full">
                Start Conversation
              </Button>
            </div>
          ) : loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-2 text-sm bg-muted">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isStreaming || !currentConversationId}
              className="flex-1"
            />
            {isStreaming ? (
              <Button
                onClick={stopStreaming}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || !currentConversationId}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}