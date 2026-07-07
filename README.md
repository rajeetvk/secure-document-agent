# Secure Document Agent

A multi-tenant AI document assistant featuring secure workspace isolation, grounded Retrieval-Augmented Generation (RAG), and agentic tool-calling. Built with Node.js, Express, Supabase (pgvector), and Google Gemini.

## Features

- **Multi-Workspace Isolation**: Documents and chat histories are strictly isolated per workspace using vector database filtering.
- **Grounded AI Answers**: The assistant only answers questions using uploaded documents.
- **Agentic Tool Calling**: AI can execute real-world side effects, such as saving tasks.
- **PDF Ingestion**: Upload, chunk, and generate vector embeddings for PDF files.

## Tech Stack

- **Backend**: Node.js & Express
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Google Gemini API (Embeddings and LLM)
