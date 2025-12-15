import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY") or "AIzaSyDLw8wSkdIZOwm_F9eZtznM2Thlr0rgrPw")

models = genai.list_models()
for m in models:
    print(getattr(m, "name", str(m)))
