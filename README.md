# Secure Document Agent

A robust, multi-tenant AI document assistant featuring strict workspace isolation, grounded Retrieval-Augmented Generation (RAG), and bidirectional agentic tool-calling. Built with Node.js, Express, Supabase (`pgvector`), and the Google Gemini API.

## Core Features

- **Multi-Tenant Vector Isolation:** Data is completely isolated at the SQL level. A single shared `document_chunks` table securely scopes vector similarity searches using strict `workspace_id` Foreign Key filters.
- **Agentic Tool Calling:** The AI isn't just a search engine; it's an autonomous agent. It can execute physical side-effects through a secure validation loop, including:
  - **Database CRUD:** Saving, retrieving, and deleting tasks directly in the PostgreSQL database.
  - **External Webhooks:** Executing REST API calls to broadcast summaries directly to a Discord server.
- **Enterprise Robustness & Security:**
  - **Prompt Injection Defense:** PDF document text is isolated within `<RETRIEVED_DOCUMENTS>` XML tags, with an explicit system prompt override preventing malicious users from executing commands hidden in uploaded files.
  - **Idempotent Ingestion:** Re-uploading an existing document automatically cascades a `DELETE` query to wipe old vector chunks, preventing database duplication and preserving search accuracy.
  - **Zero Data Loss:** If the LLM API is rate-limited or fails, the frontend catches the network error, strictly retains the user's drafted question in the input box, and persists chat history to `localStorage`.
- **Glassmorphic UI:** A dynamic, fully responsive frontend featuring real-time DOM updates, an active Document Knowledge Base panel, and a live Agent Tool Log.

## Tech Stack

- **Backend:** Node.js, Express, Multer (Memory Storage)
- **Database:** Supabase (PostgreSQL + pgvector 3072-Dimensions)
- **AI Models:** Google Gemini (`gemini-flash-latest` for inference, `gemini-embedding-2` for vectors)

## How to Run Locally

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/rajeetvk/secure-document-agent.git
   cd secure-document-agent
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Copy the provided `.env.example` file to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
   Fill in your actual API keys in the `.env` file (Supabase and Gemini).
4. **Database Setup:**
   Run the SQL commands found in `schema.sql` in your Supabase SQL Editor to create the required tables and enable the `pgvector` extension.
5. **Start the Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` in your browser.

## Deployment Strategy

This application is designed as a stateless Node.js container (file uploads are handled in RAM via Multer `memoryStorage`), making it extremely easy to deploy to cloud providers.

**Where it is deployed:**
This application is designed to be instantly deployable on platforms like **Render.com** or **Railway.app**. 

**Deployment Steps Used:**
1. Connect the GitHub repository to Render/Railway.
2. Set the Environment to `Node`.
3. Set the Build Command to: `npm install`
4. Set the Start Command to: `npm start` (or `node server.js`)
5. Copy the variables from `.env` directly into the cloud provider's Environment Variables dashboard.
*(Because Supabase hosts the PostgreSQL database remotely, the Node.js backend requires zero local persistent storage, allowing the cloud host to spin it up or scale it horizontally instantly).*
