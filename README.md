---
title: Sonicstream
emoji: 🎧
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

<div align="center">
  <img src="public/images/smart-recommendations.png" alt="Sonicstream Hero" width="100%" />

  # Sonicstream
  
  **The future of high-fidelity music streaming.**
  
  Start listening to the unseen. An immersive, AI-powered music platform built for audiophiles, featuring a hybrid neural network recommendation engine.
</div>

## 🚀 Features

- **🧠 Hybrid AI Recommendations**: Advanced recommendation engine combining Content-Based Filtering and Neural Collaborative Filtering (NCF) for personalized discovery.
- **🎧 High-Fidelity Audio**: Lossless 24-bit audio streaming experience.
- **👥 Social Listening**: Real-time collaborative playlists and live listening sessions.
- **✨ Immersive UI**: Futuristic, fluid interface aimed at visual excellence.
- **🐳 Dockerized**: Fully containerized architecture for easy deployment.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State**: Zustand

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Google Firestore (NoSQL)
- **API**: RESTful endpoints with Pydantic validation

### Recommendation Engine
- **Core**: PyTorch
- **Models**: Hybrid Neural Network (HNN), Matrix Factorization (MF)
- **Data Processing**: Pandas, Scikit-learn

## 📂 Project Structure

```bash
├── frontend/                # React application
├── backend/                 # FastAPI server & endpoints
│   ├── api/                 # API Routes (v1)
│   ├── db/                  # Database connection (Firestore)
│   └── services/            # Business logic
├── recommendation_engine/   # AI/ML Models & Training scripts
└── docker-compose.yml       # Container orchestration
```

## 🏃‍♂️ Getting Started

### Option A: Docker (Recommended)

Run the entire stack with a single command:

```bash
docker-compose up --build
```

The app will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

### Option B: Local Manual Setup

#### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

**Configuration**:
1. Place your `serviceAccountKey.json` in `backend/`.
2. Create `backend/.env` if needed (see `.env.example`).

Run the server:
```bash
python main.py
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Configuration**:
Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_GEMINI_API_KEY=your_gemini_key
```

Run the development server:
```bash
npm run dev
```

## 🧪 Machine Learning

To retrain the models:
```bash
cd recommendation_engine
python train.py
```

Built with ❤️ by [Karthikeya]
