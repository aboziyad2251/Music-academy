-- Lesson Notes table (private per student per lesson)
CREATE TABLE IF NOT EXISTS lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

-- Students can only access their own notes
CREATE POLICY "Students manage own notes"
  ON lesson_notes
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
