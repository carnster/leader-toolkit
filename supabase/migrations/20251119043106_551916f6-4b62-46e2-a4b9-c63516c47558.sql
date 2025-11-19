-- Create table for AI copilot conversations
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
ON public.ai_conversations FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create own conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
ON public.ai_conversations FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
ON public.ai_conversations FOR DELETE
USING (auth.uid() = user_id);

-- Create table for AI conversation messages
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from their conversations
CREATE POLICY "Users can view messages from own conversations"
ON public.ai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
  )
);

-- Users can create messages in their conversations
CREATE POLICY "Users can create messages in own conversations"
ON public.ai_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
  )
);

-- Create index for faster message retrieval
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id, updated_at DESC);