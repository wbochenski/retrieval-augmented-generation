![Alt text](frontend/public/favicon.svg)

# Retrieval-Augmented Generation 

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Qdrant-FF4785?style=for-the-badge&logo=qdrant&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/🤗 Transformers-FFD21E?style=for-the-badge&logoColor=black" />
  <img src="https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

A full-stack RAG system that indexes PDF documents and answers natural-language questions against them using vector search.

## Features

- **PDF indexing** — reads PDFs from `data/`, splits them into semantic chunks, and embeds them into a vector database
- **Semantic search** — queries are encoded with the same embedding model and matched against indexed chunks via cosine similarity
- **File deduplication** — SHA-256 hashing ensures unchanged files are skipped on re-index
- **Cleanup** — flush all indexed data and start fresh
- **Web UI** — React frontend with dark/light mode, top-k slider, health indicator, and animated result cards

## Quick Start

```bash
git clone https://github.com/wbochenski/retrieval-augmented-generation
cd retrieval-augmented-generation
docker compose up --build
```

Place your documents in `data/`, visit `http://localhost:3000`, click **Re-index**, then start querying.

## API Endpoints

| Method | Path       | Description                            |
|--------|------------|----------------------------------------|
| GET    | `/api/health`  | Health check                           |
| GET    | `/api/index`   | Index all PDFs in `data/`              |
| POST   | `/api/query`   | Search indexed chunks (`query`, `top_k`) |
| POST   | `/api/cleanup` | Flush Redis and reset Qdrant           |

## Project Structure

```
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── main.py          # Entry point
│       ├── model.py         # Embedding model wrapper
│       ├── db.py            # Qdrant + Redis clients
│       ├── logger.py        # Logging utility
│       └── api/
│           ├── api.py       # FastAPI routes
│           ├── index.py     # PDF indexing pipeline
│           └── query.py     # Query pipeline
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       └── RAGInterface.jsx # Main UI component
├── data/                    # Mounted PDF directory
├── docker-compose.yml
└── .gitignore
```
