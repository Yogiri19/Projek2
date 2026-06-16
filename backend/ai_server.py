import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Attempt to import g4f
try:
    import g4f
except ImportError:
    import subprocess
    print("g4f not found on runtime. Installing g4f...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "g4f", "curl_cffi"])
    import g4f

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "message": "YOGIRI.AI Python Local AI Engine is running."
    })

@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json or {}
    model_name = data.get("model", "gpt-4o")
    system_prompt = data.get("system_prompt", "")
    history = data.get("history", [])
    user_message = data.get("user_message", "")
    
    # Map model names to g4f compatible models
    g4f_model = "gpt-4o"  # Default fallback
    lower_model = model_name.lower()
    
    if "gemini" in lower_model:
        g4f_model = "gemini-2.0-flash"
    elif "deepseek" in lower_model:
        g4f_model = "gpt-4o"  # Default to gpt-4o since deepseek-v3 requires key in auto provider
    elif "claude" in lower_model:
        g4f_model = "gpt-4o"  # Default to gpt-4o for claude fallback
    elif "llama" in lower_model:
        g4f_model = "gpt-4o"
    elif "gpt-4o" in lower_model:
        g4f_model = "gpt-4o"
    elif "gpt-4" in lower_model:
        g4f_model = "gpt-4"
        
    print(f"[Python API] Request model: '{model_name}' mapped to g4f model: '{g4f_model}'")
    
    # Build messages format for g4f
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
        
    # Append history
    for msg in history:
        # Map sender_type to role
        role = "user" if msg.get("sender_type") == "user" else "assistant"
        # Sometimes msg is a dict with role and content directly
        if "role" in msg:
            role = msg["role"]
        content = msg.get("content", "")
        if content:
            messages.append({"role": role, "content": content})
            
    # Append current message
    if user_message:
        messages.append({"role": "user", "content": user_message})

    # Robust multi-fallback logic for model generation
    fallback_models = [g4f_model, "gpt-4o", "gpt-4", g4f.models.default]
    # Remove duplicates but keep order
    seen = set()
    fallback_models = [x for x in fallback_models if not (x in seen or seen.add(x))]
    
    response_text = ""
    last_error = None
    
    for model in fallback_models:
        try:
            print(f"[Python API] Trying generation with model: '{model}'...")
            response = g4f.ChatCompletion.create(
                model=model,
                messages=messages,
                timeout=25
            )
            if response and len(response.strip()) > 0:
                response_text = response
                print(f"[Python API] Generation success using model: '{model}'")
                break
        except Exception as e:
            last_error = e
            print(f"[Python API] Model '{model}' generation failed: {str(e)}")
            
    if not response_text:
        # If everything fails, return a graceful error message
        error_msg = str(last_error) if last_error else "Unknown Error"
        print(f"[Python API] All models failed. Error: {error_msg}")
        return jsonify({
            "error": f"Gagal menghasilkan respons dari AI lokal: {error_msg}. Pastikan komputer Anda terhubung ke internet."
        }), 500
        
    return jsonify({
        "response": response_text,
        "model_used": g4f_model
    })

if __name__ == "__main__":
    # Force port 8000 unless specifically overridden by a custom PYTHON_PORT env
    port = int(os.environ.get("PYTHON_PORT", 8000))
    print(f"Python Local AI Engine running on port {port}")
    app.run(host="0.0.0.0", port=port)
