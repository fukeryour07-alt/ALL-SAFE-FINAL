from main import app, gemini_client, ACTIVE_GEMINI_MODEL
print('Backend imports OK')
if gemini_client:
    print(f'Gemini AI: ONLINE - {ACTIVE_GEMINI_MODEL}')
else:
    print('Gemini AI: OFFLINE (Groq fallback active)')
