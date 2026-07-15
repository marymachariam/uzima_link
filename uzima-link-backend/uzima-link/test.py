import os
from openai import OpenAI

# 1. Initialize the client. 
# This automatically reads your OPENAI_API_KEY environment variable.
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "YOUR_ACTUAL_API_KEY_HERE"))

# 2. Open your local sample audio file
audio_file_path = "test.wav"

print("🎙️ Sending audio to Whisper API...")

try:
    with open(audio_file_path, "rb") as audio_file:
        # 3. Call the Whisper transcription endpoint
        transcription = client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file
        )
    
    # 4. Print the result text
    print("\n🎉 Success! Whisper heard:")
    print("-" * 30)
    print(transcription.text)
    print("-" * 30)

except Exception as e:
    print(f"\n❌ Test Failed! Error details: {e}")
