-- Persist TMDB loading progress per user (for resume across refresh/browser)

CREATE TABLE IF NOT EXISTS public.media_load_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  movies_pages integer NOT NULL DEFAULT 0,
  series_pages integer NOT NULL DEFAULT 0,
  animes_pages integer NOT NULL DEFAULT 0,
  docs_pages integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_load_state ENABLE ROW LEVEL SECURITY;

-- Policies (user can manage only their own row)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'media_load_state' AND policyname = 'Users can view their own load state'
  ) THEN
    CREATE POLICY "Users can view their own load state"
    ON public.media_load_state
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'media_load_state' AND policyname = 'Users can create their own load state'
  ) THEN
    CREATE POLICY "Users can create their own load state"
    ON public.media_load_state
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'media_load_state' AND policyname = 'Users can update their own load state'
  ) THEN
    CREATE POLICY "Users can update their own load state"
    ON public.media_load_state
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_media_load_state_updated_at ON public.media_load_state;
CREATE TRIGGER set_media_load_state_updated_at
BEFORE UPDATE ON public.media_load_state
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_media_load_state_user_id ON public.media_load_state(user_id);