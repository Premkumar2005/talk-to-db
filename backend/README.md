# TalkToDB Backend

## Setup

1. Create and activate a virtual environment:

   ```bash
   cd backend
   python -m venv venv
   # Windows: venv\Scripts\activate
   # Linux/Mac: source venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   - `HF_TOKEN` = your HuggingFace Inference API token
   - `HF_MODEL_URL` = model endpoint (default given)
   - DB credentials as per your MySQL setup

4. Run the server:

   ```bash
   uvicorn app:app --reload --port 8000
   ```

5. Open docs in browser:

   - http://localhost:8000/docs
