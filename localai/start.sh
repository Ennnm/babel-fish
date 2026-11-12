#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker compose up -d
echo "Starting services..."
echo "Waiting for TTS service (LocalAI) on http://127.0.0.1:8080..."
until curl -s http://127.0.0.1:8080/readyz > /dev/null 2>&1; do
  sleep 2
  echo -n "."
done
echo " Ready!"

echo "Waiting for STT service (Whisper) on http://127.0.0.1:8081..."
until curl -s http://127.0.0.1:8081/readyz > /dev/null 2>&1; do
  sleep 2
  echo -n "."
done
echo " Ready!"

echo ""
echo "All services are ready!"
echo ""
echo "Endpoints:"
echo "  TTS (English): POST http://127.0.0.1:8080/v1/audio/speech  (model: tts-1)"
echo "  TTS (Chinese): POST http://127.0.0.1:8080/v1/audio/speech  (model: tts-zh)"
echo "  STT:           POST http://127.0.0.1:8081/v1/audio/transcriptions  (model: whisper-1)"
