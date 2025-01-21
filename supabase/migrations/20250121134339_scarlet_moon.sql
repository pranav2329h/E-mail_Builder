/*
  # Email Templates Schema

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text, template name)
      - `subject` (text, email subject)
      - `content` (jsonb, template content/configuration)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users)
      - `image_urls` (text[], array of uploaded image URLs)

  2. Security
    - Enable RLS on `email_templates` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content jsonb NOT NULL,
  image_urls text[] DEFAULT '{}',
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own templates
CREATE POLICY "Users can read own templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates"
  ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON email_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);