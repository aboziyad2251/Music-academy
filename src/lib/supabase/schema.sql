-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price NUMERIC DEFAULT 0 CHECK (price >= 0),
    category TEXT,
    level TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    audio_url TEXT,
    pdf_url TEXT,
    position INTEGER NOT NULL,
    duration_min INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_id TEXT,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT false,
    watch_pct NUMERIC DEFAULT 0 CHECK (watch_pct >= 0 AND watch_pct <= 100),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Create assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_score INTEGER DEFAULT 100 CHECK (max_score > 0),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    notes TEXT,
    score INTEGER CHECK (score >= 0),
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name TEXT DEFAULT 'Music Online Academy',
    enable_ai_chat BOOLEAN DEFAULT true,
    enable_registrations BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (platform_name, enable_ai_chat, enable_registrations) 
VALUES ('Music Online Academy', true, true);

-- Row Level Security (RLS) Setup

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone."
    ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile."
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile."
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses Policies
CREATE POLICY "Published courses are viewable by everyone."
    ON courses FOR SELECT
    USING (status = 'published' OR auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Teachers can insert courses."
    ON courses FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));
CREATE POLICY "Teachers can update their own courses."
    ON courses FOR UPDATE
    USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Teachers and admins can delete courses."
    ON courses FOR DELETE
    USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Enrollments Policies
CREATE POLICY "Users see their own enrollments, teachers see course enrollments, admins see all."
    ON enrollments FOR SELECT
    USING (
        auth.uid() = student_id OR 
        EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Users can insert their own enrollments (via webhook usually) or admins."
    ON enrollments FOR INSERT
    WITH CHECK (auth.uid() = student_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Submissions Policies
CREATE POLICY "Students see own, teachers see their course submissions, admins see all."
    ON submissions FOR SELECT
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN lessons l ON a.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Students can insert their own submissions."
    ON submissions FOR INSERT
    WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own submissions."
    ON submissions FOR UPDATE
    USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

-- Lesson Progress Policies
CREATE POLICY "Students see and update their own progress."
    ON lesson_progress FOR ALL
    USING (auth.uid() = student_id);

-- Lessons Policies
CREATE POLICY "Enrolled students, teachers, admins can view lessons."
    ON lessons FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM enrollments WHERE course_id = lessons.course_id AND student_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Teachers and admins manage lessons."
    ON lessons FOR ALL
    USING (
        EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Assignments Policies
CREATE POLICY "Enrolled students, teachers, admins view assignments."
    ON assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN enrollments ON lessons.course_id = enrollments.course_id 
            WHERE lessons.id = assignments.lesson_id AND enrollments.student_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM lessons JOIN courses ON lessons.course_id = courses.id WHERE lessons.id = assignments.lesson_id AND courses.teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Teachers and admins manage assignments."
    ON assignments FOR ALL
    USING (
        EXISTS (SELECT 1 FROM lessons JOIN courses ON lessons.course_id = courses.id WHERE lessons.id = assignments.lesson_id AND courses.teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Comments Policies
CREATE POLICY "Enrolled students, teachers, admins view comments."
    ON comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN enrollments ON lessons.course_id = enrollments.course_id 
            WHERE lessons.id = comments.lesson_id AND enrollments.student_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM lessons JOIN courses ON lessons.course_id = courses.id WHERE lessons.id = comments.lesson_id AND courses.teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Enrolled students can insert comments."
    ON comments FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN enrollments ON lessons.course_id = enrollments.course_id 
            WHERE lessons.id = comments.lesson_id AND enrollments.student_id = auth.uid()
        )
    );
CREATE POLICY "Authors can update/delete their own comments, admins/teachers can manage."
    ON comments FOR UPDATE
    USING (
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM lessons JOIN courses ON lessons.course_id = courses.id WHERE lessons.id = comments.lesson_id AND courses.teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Authors can delete their own comments, admins/teachers can manage."
    ON comments FOR DELETE
    USING (
        auth.uid() = author_id OR
        EXISTS (SELECT 1 FROM lessons JOIN courses ON lessons.course_id = courses.id WHERE lessons.id = comments.lesson_id AND courses.teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Settings Policies
CREATE POLICY "Settings are viewable by everyone."
    ON settings FOR SELECT
    USING (true);
CREATE POLICY "Admins can update settings."
    ON settings FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications."
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications (e.g. mark read)."
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Only system or users can insert notifications."
    ON notifications FOR INSERT
    WITH CHECK (true); -- Usually inserted server-side by triggers or service role, but allowing open insert for webhook/db flexibility if RLS applies.

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- Trigger: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN new.email = 'tarj123@gmail.com' THEN 'admin'
      ELSE 'student'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
