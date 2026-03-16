import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    IMAGE_MODEL_ID = "prithivMLmods/Deep-Fake-Detector-Model"
    AUDIO_MODEL_ID = "harshit345/xlsr-wav2vec-speech-deepfake-detection"
    GROQ_MODEL = "llama-3.3-70b-versatile"
    MAX_VIDEO_FRAMES = 10


settings = Settings()
