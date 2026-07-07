# AI Collaboration Notes

## 1. AI Tools and Work Split
- **Model used:** Gemini 3.1 Pro.
- **Work split:** AI acted as an architectural guide. I manually typed, reviewed, and tested the code piece-by-piece to maintain full control over the vector isolation logic.

## 2. Key Decisions
- **Database & Auth:** Chose Supabase over Neon. Supabase provides both `pgvector` for embeddings and built-in user authentication, perfectly solving the "user signs in" requirement within the 72-hour deadline.
- **Workspace Isolation:** Avoided separate tables per workspace. Used a single `document_chunks` table with a `workspace_id` foreign key. Isolation is strictly enforced via SQL `WHERE workspace_id = X` filters during vector searches.

## 3. Hardest Bug / Wrong Turn
- **The Wrong Turn:** Initially, the AI tried to rush the deadline by automatically scaffolding a massive full-stack Next.js app, generating dozens of files at once. 
- **The Fix:** This hid too much complexity. I stopped the AI, forced it to delete the scaffold, and restarted with a clean, manual Node.js/Express backend. Building the SQL schema and routing step-by-step gave me full control over the security boundaries.

## 4. Future Improvements
*(To be added as the project nears completion)*
