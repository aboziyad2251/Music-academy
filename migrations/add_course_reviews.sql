-- Course Reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Public can read reviews"
  ON course_reviews FOR SELECT USING (true);

-- Enrolled students can insert their own review
CREATE POLICY "Enrolled students can insert review"
  ON course_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = course_reviews.course_id
        AND enrollments.student_id = auth.uid()
    )
  );

-- Students can update their own review
CREATE POLICY "Students can update own review"
  ON course_reviews FOR UPDATE
  USING (auth.uid() = student_id);

-- Students can delete their own review
CREATE POLICY "Students can delete own review"
  ON course_reviews FOR DELETE
  USING (auth.uid() = student_id);
