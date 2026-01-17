-- Table pour stocker les médias importés
CREATE TABLE public.media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'series', 'anime', 'documentary')),
  genres TEXT[] DEFAULT '{}',
  vote_average NUMERIC(3,1) DEFAULT 0,
  release_date DATE,
  collection_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tmdb_id, media_type)
);

-- Table pour les collections/sagas
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tmdb_collection_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tmdb_collection_id)
);

-- Table pour l'état d'importation
CREATE TABLE public.import_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  movies_page INTEGER NOT NULL DEFAULT 1,
  series_page INTEGER NOT NULL DEFAULT 1,
  movies_total_pages INTEGER DEFAULT 500,
  series_total_pages INTEGER DEFAULT 500,
  movies_imported INTEGER NOT NULL DEFAULT 0,
  series_imported INTEGER NOT NULL DEFAULT 0,
  movies_skipped INTEGER NOT NULL DEFAULT 0,
  series_skipped INTEGER NOT NULL DEFAULT 0,
  collections_count INTEGER NOT NULL DEFAULT 0,
  is_importing BOOLEAN NOT NULL DEFAULT false,
  current_phase TEXT DEFAULT 'movies',
  last_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX idx_media_items_user_id ON public.media_items(user_id);
CREATE INDEX idx_media_items_tmdb_id ON public.media_items(tmdb_id);
CREATE INDEX idx_media_items_media_type ON public.media_items(media_type);
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_import_state_user_id ON public.import_state(user_id);

-- Enable RLS
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_items
CREATE POLICY "Users can view their own media items"
ON public.media_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media items"
ON public.media_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media items"
ON public.media_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media items"
ON public.media_items FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for collections
CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.collections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.collections FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for import_state
CREATE POLICY "Users can view their own import state"
ON public.import_state FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import state"
ON public.import_state FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import state"
ON public.import_state FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_media_items_updated_at
BEFORE UPDATE ON public.media_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_import_state_updated_at
BEFORE UPDATE ON public.import_state
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();