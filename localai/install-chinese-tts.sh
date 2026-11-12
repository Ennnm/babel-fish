#!/bin/bash
LOCALAI=http://127.0.0.1:8080

if ! curl -s $LOCALAI/readyz > /dev/null 2>&1; then
  echo "Error: LocalAI is not running. Start it first with ./start.sh"
  exit 1
fi

echo "Installing Chinese TTS (zh_CN-huayan-x_low)..."
response=$(curl -s $LOCALAI/models/apply -H "Content-Type: application/json" -d '{
  "url": "github:mudler/LocalAI/gallery/piper.yaml@master",
  "name": "tts-zh",
  "overrides": {
    "parameters": {
      "model": "zh_CN-huayan-x_low.onnx"
    }
  },
  "files": [
    {
      "uri": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx",
      "filename": "zh_CN-huayan-x_low.onnx"
    },
    {
      "uri": "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx.json",
      "filename": "zh_CN-huayan-x_low.onnx.json"
    }
  ]
}')
echo "Chinese TTS job: $response"

echo ""
echo "Chinese TTS installation queued!"
echo "Wait 1-2 minutes for download (~21 MB), then restart LocalAI:"
echo "  ./stop.sh && ./start.sh"
