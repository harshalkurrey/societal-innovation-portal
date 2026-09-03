/*
# Create core schema for Societal Problem-Solving Platform MVP

1. Overview
This migration builds the foundational database for a Smart India Hackathon demo
platform connecting citizens, universities, and admins. It supports:
- Role-based authentication (citizen, university, admin)
- Citizens submitting societal problems with photos and location
- Universities viewing, accepting, and forming teams around problems
- Admins viewing analytics across all problems

2. New Tables
- `profiles`: Extends Supabase auth.users with name, role (citizen/university/admin),
  and institution name (for universities). One row per auth user.
- `problems`: Core entity. Submitted by a citizen. Has title, description, category,
  location fields, photo URL, status (submitted/assigned/in_progress/resolved),
  priority, and assigned university reference.
- `team_members`: Mock team members (faculty/students) created by a university for a
  problem's project. Stores name, role, and department as plain text.
- `status_history`: Audit log of every status change on a problem with actor and notes.

3. Security (RLS)
- `profiles`: All authenticated users can read profiles. Users can insert/update their own.
- `problems`: All authenticated users can read. Citizens can insert/update/delete their own.
  Universities can update problems assigned to them or any problem (for accept flow).
- `team_members`: All authenticated users can read. Universities assigned to the problem
  can insert/delete team members.
- `status_history`: All authenticated users can read. Any authenticated user can insert.

4. Notes
- Role is stored in profiles.role. A trigger auto-creates a profile row on signup.
- Owner columns default to auth.uid() so client inserts omitting user_id succeed.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'university', 'admin')),
  institution_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- PROBLEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  location text,
  district text,
  photo_url text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'assigned', 'in_progress', 'resolved')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  submitted_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_university_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_problems" ON problems;
CREATE POLICY "select_problems" ON problems FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_problems" ON problems;
CREATE POLICY "insert_own_problems" ON problems FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "update_own_problems" ON problems;
CREATE POLICY "update_own_problems" ON problems FOR UPDATE
  TO authenticated USING (auth.uid() = submitted_by) WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "delete_own_problems" ON problems;
CREATE POLICY "delete_own_problems" ON problems FOR DELETE
  TO authenticated USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "university_update_problems" ON problems;
CREATE POLICY "university_update_problems" ON problems FOR UPDATE
  TO authenticated
  USING (
    assigned_university_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'university')
  )
  WITH CHECK (true);

-- ============================================================
-- TEAM_MEMBERS (mock users for university teams)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  name text NOT NULL,
  member_role text NOT NULL CHECK (member_role IN ('faculty', 'student')),
  department text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_team_members" ON team_members;
CREATE POLICY "select_team_members" ON team_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_team_members" ON team_members;
CREATE POLICY "insert_team_members" ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_id
      AND (p.assigned_university_id = auth.uid() OR p.submitted_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "delete_team_members" ON team_members;
CREATE POLICY "delete_team_members" ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_id
      AND p.assigned_university_id = auth.uid()
    )
  );

-- ============================================================
-- STATUS_HISTORY (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_status_history" ON status_history;
CREATE POLICY "select_status_history" ON status_history FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_status_history" ON status_history;
CREATE POLICY "insert_status_history" ON status_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = changed_by);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_problems_submitted_by ON problems(submitted_by);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_assigned_university ON problems(assigned_university_id);
CREATE INDEX IF NOT EXISTS idx_team_members_problem_id ON team_members(problem_id);
CREATE INDEX IF NOT EXISTS idx_status_history_problem_id ON status_history(problem_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, institution_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    NEW.raw_user_meta_data->>'institution_name'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS problems_updated_at ON problems;
CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
