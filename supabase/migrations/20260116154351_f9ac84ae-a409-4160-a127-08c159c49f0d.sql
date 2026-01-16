-- Table to store uploaded media IDs per user
CREATE TABLE public.uploaded_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, media_id)
);

-- Enable Row Level Security
ALTER TABLE public.uploaded_media ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own uploads" 
ON public.uploaded_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads" 
ON public.uploaded_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads" 
ON public.uploaded_media 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_uploaded_media_user_id ON public.uploaded_media(user_id);
CREATE INDEX idx_uploaded_media_media_id ON public.uploaded_media(media_id);