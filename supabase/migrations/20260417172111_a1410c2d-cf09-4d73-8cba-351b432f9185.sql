-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Resumes
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  raw_text TEXT,
  ats_score INTEGER,
  matched_keywords TEXT[],
  missing_keywords TEXT[],
  suggestions TEXT,
  detected_skills TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Interviews
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  overall_score INTEGER,
  content_score INTEGER,
  clarity_score INTEGER,
  confidence_score INTEGER,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own interviews" ON public.interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own interviews" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own interviews" ON public.interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own interviews" ON public.interviews FOR DELETE USING (auth.uid() = user_id);

-- Answers
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question TEXT NOT NULL,
  transcript TEXT,
  content_score INTEGER,
  clarity_score INTEGER,
  confidence_score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own answers" ON public.answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert own answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own answers" ON public.answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete own answers" ON public.answers FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_interviews_user ON public.interviews(user_id, created_at DESC);
CREATE INDEX idx_answers_interview ON public.answers(interview_id, question_index);
CREATE INDEX idx_resumes_user ON public.resumes(user_id, created_at DESC);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();