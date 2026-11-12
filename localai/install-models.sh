#!/bin/bash
LOCALAI=http://127.0.0.1:8080

if ! curl -s $LOCALAI/readyz > /dev/null 2>&1; then
  echo "Error: LocalAI is not running. Start it first with ./start.sh"
  exit 1
fi

echo "Installing Whisper (tiny)..."
response=$(curl -s $LOCALAI/models/apply -H "Content-Type: application/json" -d '{
  "url": "github:mudler/LocalAI/gallery/whisper-base.yaml@master",
  "name": "whisper-1",
  "overrides": {
    "parameters": {
      "model": "whisper-tiny.bin"
    }
  },
  "files": [
    {
      "uri": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
      "filename": "whisper-tiny.bin"
    }
  ]
}')
echo "Whisper job: $response"

echo ""
echo "Installing Piper TTS (en_US-lessac-medium)..."
response=$(curl -s $LOCALAI/models/apply -H "Content-Type: application/json" -d '{
  "url": "github:mudler/LocalAI/gallery/piper.yaml@master",
  "name": "tts-1",
  "overrides": {
    "parameters": {
      "model": "en_US-lessac-medium.onnx"
    }
  },
  "files": [
    {
      "uri": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
      "filename": "en_US-lessac-medium.onnx"
    },
    {
      "uri": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
      "filename": "en_US-lessac-medium.onnx.json"
    }
  ]
}')
echo "Piper job: $response"

echo ""
echo "Models installation queued!"
echo "Check status: curl $LOCALAI/models/jobs | jq"
echo ""
echo "Wait 2-3 minutes for downloads to complete, then restart LocalAI:"
echo "  ./stop.sh && ./start.sh"
echo ""
echo "Then test with:"
echo "  curl $LOCALAI/v1/models | jq"
