-- ============================================================
--  K MARK'S GYM  —  Supabase / PostgreSQL Schema
--  Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE user_role       AS ENUM ('admin', 'trainer', 'member');
CREATE TYPE gender_type     AS ENUM ('male', 'female', 'other');
CREATE TYPE plan_duration   AS ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly');
CREATE TYPE payment_status  AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method  AS ENUM ('cash', 'card', 'upi', 'bank_transfer', 'other');
CREATE TYPE session_status  AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE meal_type       AS ENUM ('breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner', 'pre_workout', 'post_workout');
CREATE TYPE day_of_week     AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');


-- ─────────────────────────────────────────────────────────────
--  1. USERS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  phone         TEXT,
  role          user_role   NOT NULL DEFAULT 'member',
  avatar_url    TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);


-- ─────────────────────────────────────────────────────────────
--  1.5. BRANCHES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  location    TEXT,
  manager_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  2. MEMBERS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE members (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth           DATE,
  gender                  gender_type,
  height_cm               NUMERIC(5,1),
  weight_kg               NUMERIC(5,1),
  address                 TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  medical_conditions      TEXT,
  fitness_goal            TEXT,
  joined_at               DATE        NOT NULL DEFAULT CURRENT_DATE,
  membership_end          DATE,
  assigned_trainer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  branch_id               UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_user_id ON members (user_id);
CREATE INDEX idx_members_trainer ON members (assigned_trainer_id);
CREATE INDEX idx_members_branch  ON members (branch_id);


-- ─────────────────────────────────────────────────────────────
--  3. TRAINERS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE trainers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialization   TEXT,
  experience_years INTEGER     DEFAULT 0,
  bio              TEXT,
  certifications   TEXT[],
  available_from   TIME,
  available_to     TIME,
  max_clients      INTEGER     DEFAULT 20,
  per_session_fee  NUMERIC(10,2),
  branch_id        UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trainers_user_id ON trainers (user_id);
CREATE INDEX idx_trainers_branch  ON trainers (branch_id);


-- ─────────────────────────────────────────────────────────────
--  4. PLANS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE plans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT          NOT NULL,
  description      TEXT,
  duration         plan_duration NOT NULL,
  duration_days    INTEGER       NOT NULL,
  price            NUMERIC(10,2) NOT NULL,
  includes_trainer BOOLEAN       NOT NULL DEFAULT FALSE,
  includes_diet    BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  5. WORKOUT_PLANS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE workout_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_plans_member  ON workout_plans (member_id);
CREATE INDEX idx_workout_plans_trainer ON workout_plans (trainer_id);


-- ─────────────────────────────────────────────────────────────
--  6. WORKOUT_DAYS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE workout_days (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID        NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day             day_of_week NOT NULL,
  focus_area      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_days_plan ON workout_days (workout_plan_id);


-- ─────────────────────────────────────────────────────────────
--  7. EXERCISES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE exercises (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_day_id   UUID        NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  sets             INTEGER,
  reps             TEXT,
  weight_kg        NUMERIC(5,1),
  rest_seconds     INTEGER,
  duration_minutes INTEGER,
  notes            TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_day ON exercises (workout_day_id);


-- ─────────────────────────────────────────────────────────────
--  8. DIET_PLANS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE diet_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  title          TEXT        NOT NULL,
  description    TEXT,
  daily_calories INTEGER,
  protein_g      NUMERIC(6,1),
  carbs_g        NUMERIC(6,1),
  fat_g          NUMERIC(6,1),
  start_date     DATE,
  end_date       DATE,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diet_plans_member  ON diet_plans (member_id);
CREATE INDEX idx_diet_plans_trainer ON diet_plans (trainer_id);


-- ─────────────────────────────────────────────────────────────
--  9. MEALS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE meals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diet_plan_id UUID        NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  meal_type    meal_type   NOT NULL,
  title        TEXT        NOT NULL,
  description  TEXT,
  calories     INTEGER,
  protein_g    NUMERIC(6,1),
  carbs_g      NUMERIC(6,1),
  fat_g        NUMERIC(6,1),
  time_slot    TIME,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_diet_plan ON meals (diet_plan_id);


-- ─────────────────────────────────────────────────────────────
-- 10. PROGRESS_LOGS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE progress_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at    DATE        NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    NUMERIC(5,1),
  body_fat_pct NUMERIC(4,1),
  chest_cm     NUMERIC(5,1),
  waist_cm     NUMERIC(5,1),
  hips_cm      NUMERIC(5,1),
  bicep_cm     NUMERIC(5,1),
  thigh_cm     NUMERIC(5,1),
  notes        TEXT,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_progress_member ON progress_logs (member_id, logged_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 11. ATTENDANCE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE attendance (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_member ON attendance (member_id, check_in DESC);


-- ─────────────────────────────────────────────────────────────
-- 12. SESSIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id   UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ    NOT NULL,
  duration_min INTEGER        NOT NULL DEFAULT 60,
  status       session_status NOT NULL DEFAULT 'scheduled',
  location     TEXT,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_member  ON sessions (member_id, scheduled_at DESC);
CREATE INDEX idx_sessions_trainer ON sessions (trainer_id, scheduled_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 13. SESSION_NOTES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE session_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_notes_session ON session_notes (session_id);


-- ─────────────────────────────────────────────────────────────
-- 14. PAYMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id        UUID           REFERENCES plans(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2)  NOT NULL,
  currency       TEXT           NOT NULL DEFAULT 'INR',
  payment_method payment_method NOT NULL DEFAULT 'cash',
  status         payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  paid_at        TIMESTAMPTZ,
  period_start   DATE,
  period_end     DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_member ON payments (member_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status);


-- ─────────────────────────────────────────────────────────────
-- 15. ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  target_role  user_role,
  is_pinned    BOOLEAN     NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements (published_at DESC);

-- -------------------------------------------------------------
-- 16. EXPENSES
-- -------------------------------------------------------------

CREATE TABLE expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id      UUID REFERENCES branches(id) ON DELETE SET NULL,
  category       TEXT NOT NULL DEFAULT 'Other',
  description    TEXT NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PENDING',
  due_date       DATE NOT NULL,
  paid_date      DATE,
  payment_method TEXT,
  is_recurring   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_branch ON expenses(branch_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);

-- -------------------------------------------------------------
-- 17. LEADS
-- -------------------------------------------------------------

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT DEFAULT 'Walk-in',
  status TEXT DEFAULT 'New',
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_follow_up ON leads (follow_up_date);
