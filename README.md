# NorthStar — AI-Powered Cybersecurity Platform

> Built at IndiaNext 2026 · 2nd Runner Up

NorthStar is a full-stack cybersecurity platform that combines multiple AI-driven detection systems under one roof — from phishing URL analysis and deepfake detection to real-time prompt injection defense and login anomaly alerts.

---

## Features

| Service | What it does |
|---|---|
| **AI Security Assistant** | RAG-powered chatbot trained on cybersecurity knowledge. Answers threat queries, explains vulnerabilities, and guides incident response via voice or text. |
| **Phishing Detection** | Analyzes URLs in real time using VirusTotal, Google Safe Browsing, and a two-stage Groq LLM pipeline (triage → deep analysis). |
| **Deepfake Detection** | Detects AI-generated images and videos using HuggingFace vision models with LLM-generated explanations. |
| **Prompt Injection Guard** | API middleware that catches prompt injection and jailbreak attempts before they reach your LLM — heuristic + LLM classifier combo. |
| **Login Anomaly Detection** | Flags suspicious login patterns (unusual location, time, device) and sends Telegram alerts in real time. |
| **Vulnerable Demo App** | A deliberately vulnerable application used to demonstrate attack surfaces and test the platform's detection capabilities live. |
| **Community Expert System** | Users can apply to become verified cybersecurity experts and answer questions from the community. |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                React Frontend                    │
│         (Vite + Tailwind + Supabase Auth)        │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │AI Service│ │ Phishing │ │Deepfake  │
  │  :8000   │ │  :8001   │ │  :8002   │
  └────┬─────┘ └──────────┘ └──────────┘
       │
  ┌────┴──────┐    ┌──────────────┐   ┌──────────────┐
  │  Qdrant   │    │Prompt Guard  │   │Login Anomaly │
  │ (vectors) │    │    :8003     │   │    :8005     │
  └───────────┘    └──────────────┘   └──────────────┘
       │
  ┌────┴──────┐
  │   Redis   │
  │  (cache)  │
  └───────────┘
```

**Stack:**
- **Frontend:** React, Vite, Tailwind CSS, Supabase Auth
- **Backend:** Python, FastAPI (6 microservices)
- **LLM:** Groq (Llama 3.1 / 3.3)
- **Vector DB:** Qdrant + BGE embeddings
- **TTS/STT:** ElevenLabs + Groq Whisper
- **Cache:** Redis
- **Deployment:** Docker Compose

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- API keys for: Groq, Supabase, ElevenLabs, VirusTotal, Google Safe Browsing, HuggingFace, Telegram

### 1. Clone the repo

```bash
git clone https://github.com/Yash-Singh18/IndiaNext.git
cd IndiaNext
```

### 2. Configure environment variables

Each service has a `.env.example` — copy and fill in your keys:

```bash
cp ai-service/.env.example ai-service/.env
cp phishingdetection/.env.example phishingdetection/.env
cp deepfake-service/.env.example deepfake-service/.env
cp login-anomaly-service/.env.example login-anomaly-service/.env
cp prompt-guard-service/.env.example prompt-guard-service/.env
cp vulnerable-demo/.env.example vulnerable-demo/.env
cp frontend/.env.example frontend/.env
```

### 3. Start all services

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| AI Service | http://localhost:8000 |
| Phishing Detection | http://localhost:8001 |
| Deepfake Detection | http://localhost:8002 |
| Prompt Guard | http://localhost:8003 |
| Vulnerable Demo | http://localhost:8004 |
| Login Anomaly | http://localhost:8005 |
| Qdrant Dashboard | http://localhost:6333/dashboard |

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
IndiaNext/
├── ai-service/              # RAG chatbot + voice (FastAPI)
├── phishingdetection/       # URL phishing analyzer (FastAPI)
├── deepfake-service/        # Image/video deepfake detector (FastAPI)
├── prompt-guard-service/    # Prompt injection API middleware (FastAPI)
├── login-anomaly-service/   # Suspicious login detector (FastAPI)
├── vulnerable-demo/         # Demo vulnerable app (FastAPI)
├── frontend/                # React web app
├── supabase/                # DB migrations & config
└── docker-compose.yml
```

---

Built in 24 hours at IndiaHacks 2026 organized by KES Shroff College.

