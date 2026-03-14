import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")
try:
    response = model.generate_content("hello")
    print("Success:", response.text)
except Exception as e:
    print(repr(e))
