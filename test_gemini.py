import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env file.")
else:
    print(f"✅ Found API Key: {api_key[:10]}...")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content("Hello, this is a test. Reply with 'Gemini 2.0 is working!'.")
        print(f"🤖 Response: {response.text}")
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
