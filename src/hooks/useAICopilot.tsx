import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  initiative_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CopilotContext {
  currentPage?: string;
  currentStage?: string;
  initiative?: any;
  teamSize?: number;
  activeIngredients?: number;
  milestones?: {
    total: number;
    completed: number;
    pending: number;
  };
  fidelityScore?: number;
  recentActivity?: string;
}

export function useAICopilot(initiativeId?: string) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["ai-conversations", initiativeId],
    queryFn: async () => {
      const query = supabase
        .from("ai_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (initiativeId) {
        query.eq("initiative_id", initiativeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Conversation[];
    },
  });

  // Fetch messages for current conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["ai-messages", currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return [];
      
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!currentConversationId,
  });

  // Create new conversation
  const createConversation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          initiative_id: initiativeId || null,
          title: "New conversation",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message with streaming
  const sendMessage = useCallback(async (
    content: string, 
    context?: CopilotContext,
    onDelta?: (deltaText: string) => void
  ) => {
    if (!currentConversationId) {
      await createConversation.mutateAsync();
      return;
    }

    try {
      setIsStreaming(true);

      // Save user message
      const { error: userMsgError } = await supabase
        .from("ai_messages")
        .insert({
          conversation_id: currentConversationId,
          role: "user",
          content,
        });

      if (userMsgError) throw userMsgError;

      // Invalidate messages to show user message immediately
      queryClient.invalidateQueries({ queryKey: ["ai-messages", currentConversationId] });

      // Prepare messages for API
      const allMessages = messages || [];
      const apiMessages = [
        ...allMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content }
      ];

      // Stream response
      abortControllerRef.current = new AbortController();
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in to use AI features.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ 
            messages: apiMessages,
            context 
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              onDelta?.(content);
            }
          } catch (e) {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantMessage) {
        await supabase.from("ai_messages").insert({
          conversation_id: currentConversationId,
          role: "assistant",
          content: assistantMessage,
        });

        // Update conversation timestamp
        await supabase
          .from("ai_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);

        queryClient.invalidateQueries({ queryKey: ["ai-messages", currentConversationId] });
        queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }
      
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [currentConversationId, messages, queryClient, toast]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    conversations,
    messages,
    currentConversationId,
    isStreaming,
    loadingConversations,
    loadingMessages,
    setCurrentConversationId,
    createConversation: createConversation.mutate,
    sendMessage,
    stopStreaming,
  };
}