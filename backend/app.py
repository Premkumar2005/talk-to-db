import os
import re
from typing import Optional, List
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import mysql.connector

# Load env variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_DATABASE = os.getenv("DB_DATABASE", "talktodb")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# FastAPI app
app = FastAPI(title="TalkToDB Backend (FastAPI + MySQL)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Request Models ----------
class GenerateRequest(BaseModel):
    prompt: Optional[str] = None

class RunRequest(BaseModel):
    sql: str

# ---------- Gemini SQL Generator ----------
def call_gemini(prompt: str) -> str:
    """Generate SQL using your available Gemini model."""
    
    if not GEMINI_API_KEY:
        print("WARNING: No GEMINI_API_KEY found.")
        return "SELECT 1;"

    # System instruction for SQL generation
    system_msg = (
        "You are an expert SQL generator. Given a natural language question, "
        "generate a valid SQL SELECT statement for a MySQL database.\n"
        "Tables:\n"
        "  users(id, name, email, created_at)\n"
        "  transactions(id, user_id, amount, txn_date, status)\n"
        "Return ONLY the SQL query, nothing else."
    )

    try:
        # ✔ THE ONLY MODEL YOUR KEY SUPPORTS
        # model = genai.GenerativeModel("models/gemini-2.5-pro")
        model = genai.GenerativeModel("models/gemini-2.5-flash")

       



        full_prompt = system_msg + f"\n\nQuestion: {prompt}\n\nSQL:"
        response = model.generate_content(full_prompt)

        sql = response.text.strip()
        sql = sql.replace("```sql", "").replace("```", "").strip()

        return sql

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

# ---------- Safe SELECT filter ----------

# def is_safe_select(sql: str) -> bool:
#     if not sql:
#         return False
#     s = sql.strip().lstrip(";")

#     # Must start with SELECT
#     if not re.match(r"(?i)^SELECT\b", s):
#         return False

#     forbidden = [
#         "DELETE", "UPDATE", "INSERT", "DROP", "ALTER",
#         "TRUNCATE", "CREATE", "REPLACE", "GRANT", "REVOKE"
#     ]

#     up = s.upper()
#     for word in forbidden:
#         if word in up:
#             return False

#     return True

# ---------- Run query on DB ----------
def run_sql_on_db(sql: str) -> List[dict]:
    conn = None
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DATABASE,
            connection_timeout=10,
        )

        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql)

        try:
            rows = cursor.fetchall()
        except mysql.connector.errors.InterfaceError:
            rows = []

        cursor.close()
        return rows

    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"MySQL error: {err}")

    finally:
        if conn and conn.is_connected():
            conn.close()


# ---------- Routes ----------
@app.get("/")
def root():
    return {
        "message": "TalkToDB backend is running!",
        "docs": "/docs",
        "using_model": "models/gemini-2.5-pro",
        "database": DB_DATABASE
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate-sql")
def generate_sql(req: GenerateRequest):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    sql = call_gemini(req.prompt.strip())
    return {"generated_sql": sql}

@app.post("/run-query")
def run_query(req: RunRequest):
    sql = req.sql

    if not sql:
        raise HTTPException(status_code=400, detail="SQL is required")

    # if not is_safe_select(sql):
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Only safe SELECT queries are allowed!"
    #     )

    rows = run_sql_on_db(sql)
    return {"rows_returned": len(rows), "data": rows}

# ---------- Uvicorn ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
