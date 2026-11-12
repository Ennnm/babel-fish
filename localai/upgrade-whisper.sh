#!/bin/bash
LOCALAI=http://127.0.0.1:8080

if ! curl -s $LOCALAI/readyz > /dev/null 2>&1; then
  echo "Error: LocalAI is not running. Start it first with ./start.sh"
  exit 1
fi

echo "Upgrading to Whisper Small (488 MB)..."
response=$(curl -s $LOCALAI/models/apply -H "Content-Type: application/json" -d '{
  "url": "github:mudler/LocalAI/gallery/whisper-base.yaml@master",
  "name": "whisper-1",
  "overrides": {
    "parameters": {
      "model": "whisper-small.bin"
    }
  },
  "files": [
    {
      "uri": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
      "filename": "whisper-small.bin"
    }
  ]
}')
echo "Upgrade job: $response"

echo ""
echo "Whisper Small installation queued."
echo "Size: 488 MB - this may take a few minutes."
echo ""
echo "After download completes, restart LocalAI:"
echo "  ./stop.sh && ./start.sh"
echo ""
echo "Check status: curl $LOCALAI/models/jobs | jq"
