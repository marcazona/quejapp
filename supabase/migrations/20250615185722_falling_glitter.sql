/*
  # Chat System for Live Company Support

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `company_id` (uuid, foreign key to companies)
      - `status` (text, active/closed/pending)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to chat_conversations)
      - `sender_id` (uuid, can be user_id or company representative)
      - `sender_type` (text, user/company)
      - `content` (text, message content)
      - `message_type` (text, text/image/file)
      - `read_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only see their own conversations
    - Companies can see conversations related to them
    - Users can send messages in their conversations
*/

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id, status)
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
  ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chat_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER handle_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL, -- Can be user_id or 'system' or company rep id
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'company')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND sender_id::uuid = auth.uid()
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND sender_id::uuid = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_company_id ON chat_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);