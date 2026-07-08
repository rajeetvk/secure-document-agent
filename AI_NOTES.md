# AI Collaboration Notes

## 1. AI Tools and Work Split
- **Model used:** Gemini 3.1 Pro / Antigravity Agent.
- **Work split:** The AI acted as an architectural guide and rapid prototyper. I manually directed the flow, reviewed every line of code, and architected the strict vector isolation and database structures to maintain complete control over the multi-tenant logic.

## 2. Key Decisions
- **Database & Auth:** Chose Supabase over Neon. Supabase provides both `pgvector` for embeddings and built-in user authentication, solving the "secure user sign-in" requirement while allowing for seamless agentic capabilities.
- **Workspace Isolation:** Avoided naive table-per-tenant architectures. Instead, used a single shared `document_chunks` table with a strictly enforced `workspace_id` foreign key. Isolation is guaranteed at the SQL level via `WHERE workspace_id = X` filters during all vector searches.
- **Agentic Flow:** Rather than a simple RAG search engine, I implemented a true Agent using Gemini's `startChat` and `functionDeclarations`. The backend intercepts function calls, interacts with the database (e.g., saving tasks), and feeds the physical result back to the LLM to create a continuous autonomous loop.

## 3. Hardest Bugs & Wrong Turns
- **The Silent Failure Mismatch:**
  - **The Wrong Turn:** When integrating the RAG pipeline, the AI suggested using the deprecated `text-embedding-004` model (768 dimensions), but the environment forced an upgrade to `gemini-embedding-2` (3072 dimensions). 
  - **How I Noticed:** My RAG queries were returning 0 matches. I debugged the ingestion route and realized the AI's database insert block was missing an explicit error trap (`if (error) throw error;`). The 3072-dimension vectors were quietly failing to insert into the 768-dimension PostgreSQL table, resulting in a "silent failure".
  - **The Fix:** I dropped the table, rebuilt it to explicitly accept `vector(3072)`, and added strict error handling to the Node.js ingestion loop to prevent future silent failures.

- **The Indexing Over-Optimization:**
  - **The Wrong Turn:** The AI provided an SQL script to generate an `hnsw` index on the new 3072-dimension vector table to optimize searches.
  - **How I Noticed:** The database threw a fatal `54000` error: `column cannot have more than 2000 dimensions for hnsw index`.
  - **The Fix:** I realized that at the scale of a single isolated workspace (a few hundred to a thousand chunks), an index is an unnecessary over-optimization. A sequential Cosine Distance scan is mathematically instantaneous at this scale. I stripped the index creation out entirely, prioritizing architectural simplicity and the superior accuracy of the 3072-dimension model over unnecessary graph indexing.

## 4. Future Improvements
*(To be added after Frontend deployment)*