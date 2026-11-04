-- Sistema ACE 2026. Ejecutar únicamente dentro de la base "ace_2026".
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS schools_name_unique ON schools (LOWER(name));

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  survey_type VARCHAR(20) NOT NULL CHECK (survey_type IN ('estudiantes','padres','personal')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  grade VARCHAR(20),
  position VARCHAR(40),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT survey_classification CHECK (
    (survey_type IN ('estudiantes','padres') AND grade IN ('PRIMARIA','SECUNDARIA') AND position IS NULL)
    OR (survey_type = 'personal' AND grade IS NULL AND position IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS surveys_created_idx ON surveys (created_at DESC);
CREATE INDEX IF NOT EXISTS surveys_school_idx ON surveys (school_id);
CREATE INDEX IF NOT EXISTS surveys_type_idx ON surveys (survey_type);
