import os
import requests
from pydub import AudioSegment

AUDIO_URL = (
    "https://archive.org/download/SteveJobsSpeechAtStanfordUniversity/"
    "SteveJobsSpeech.mp3"
)
OUTPUT_DIR = "backend/data/jobs_speech_clips"
RAW_AUDIO_FILE = os.path.join(OUTPUT_DIR, "jobs_full_raw.mp3")

# Example slices — adjust timestamps as needed
SLICES = [
    {"title": "intro", "start": 0, "end": 60_000},
    {"title": "college_story", "start": 60_000, "end": 180_000},
    {"title": "cancer_story", "start": 600_000, "end": 660_000},
    {"title": "stay_hungry", "start": 900_000, "end": 960_000},
]

def download_and_log():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    response = requests.get(AUDIO_URL, stream=True)
    print(f"Downloading from: {AUDIO_URL}")
    print(f"HTTP status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}\n")

    if response.status_code == 200 and "audio" in response.headers.get("content-type", ""):
        size = 0
        with open(RAW_AUDIO_FILE, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    size += len(chunk)
                    f.write(chunk)
        print(f"Download complete: {size / 1024:.2f} KB")

        with open(RAW_AUDIO_FILE, "rb") as f:
            header = f.read(10)
        print(f"First 10 bytes: {header}\n")
        return True
    else:
        print("Failed to download a valid audio file.")
        return False

def slice_audio():
    print("Loading audio via pydub...")
    try:
        audio = AudioSegment.from_file(RAW_AUDIO_FILE, format="mp3")
    except Exception as e:
        print(f"Error loading audio: {e}")
        return

    for s in SLICES:
        clip = audio[s["start"]:s["end"]]
        out_path = os.path.join(OUTPUT_DIR, f"{s['title']}.mp3")
        clip.export(out_path, format="mp3", bitrate="192k")
        print(f"Exported segment: {out_path}")

if __name__ == "__main__":
    if download_and_log():
        slice_audio()
    else:
        print("Exiting due to download failure.")
