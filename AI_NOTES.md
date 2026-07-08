# AI Collaboration Notes

## 1. AI Tools and Work Split
- **Model used:** Gemini 3.1 Pro.
- **Work split:** AI acted as an architectural guide. I manually typed, reviewed, and tested the code piece-by-piece to maintain full control over the vector isolation logic.

## 2. Key Decisions
- **Database & Auth:** Chose Supabase over Neon. Supabase provides both `pgvector` for embeddings and built-in user authentication, perfectly solving the "user signs in" requirement within the 72-hour deadline.
- **Workspace Isolation:** Avoided separate tables per workspace. Used a single `document_chunks` table with a `workspace_id` foreign key. Isolation is strictly enforced via SQL `WHERE workspace_id = X` filters during vector searches.
- **Chunking Strategy:** Implemented a chunk size of 1000 characters with a 200-character overlap. This ensures we respect the LLM's context window, while the overlap prevents critical sentences from losing meaning by being chopped in half at chunk boundaries.

## 3. Hardest Bug / Wrong Turn
- **The Architecture Wrong Turn:** Initially, the AI tried to rush the deadline by automatically scaffolding a massive full-stack Next.js app. This hid too much complexity, so I stopped the AI, forced it to delete the scaffold, and restarted with a clean manual Node.js backend.
- **The RAG Wrong Turn:** When building the document ingestion pipeline, the AI suggested a naive "hard-cut" chunking loop with zero overlap (`i += chunkSize`). I noticed this would chop sentences perfectly in half and destroy semantic meaning before embedding. I corrected the AI and rewrote the loop to include a 200-character overlap (`i += chunkSize - overlap`) to ensure context is preserved across boundaries.

## 4. Future Improvements
*(To be added as the project nears completion)*
