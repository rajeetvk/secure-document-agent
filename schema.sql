-- 1. Enable the pgvector extension (this is magic that allows us to store AI embeddings)
create extension if not exists vector;

-- 2. Workspaces Table
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Documents Table (Tracks the files uploaded to a workspace)
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  filename text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Document Chunks Table (The Shared Vector Store)
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade not null, -- This enforces our strict isolation!
  content text not null,
  embedding vector(768) not null, -- 768 is the exact dimension size for Google Gemini's embedding model
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast vector similarity search
create index on public.document_chunks using hnsw (embedding vector_cosine_ops);

-- 5. Tasks Table (We will use this for our AI "Tool Calling" side-effect)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
