from flask import Flask, render_template, request, jsonify
import pyttsx3
import datetime
import webbrowser
import openai
import os
import re
from googlesearch import search
from dotenv import load_dotenv
load_dotenv()
app = Flask(__name__)
openai.api_key = os.getenv('OPENAI_API_KEY')
GPT_AVAILABLE = bool(openai.api_key)
try:
    engine = pyttsx3.init()
    engine.setProperty('rate', 170)
    TTS_AVAILABLE = True
except:
    TTS_AVAILABLE = False
def speak(text):
    if TTS_AVAILABLE:
        try:
            engine.stop()  # Prevent overlapping speech
            engine.say(text)
            engine.runAndWait()
        except RuntimeError:
            print("TTS loop issue, skipping...")

def smart_action(command):
    """Detect websites/apps and open them intelligently"""
    command_lower = command.lower()
    websites = {
        "youtube": "https://youtube.com",
        "google": "https://google.com", 
        "chatgpt": "https://chatgpt.com",
        "whatsapp": "https://web.whatsapp.com",
        "instagram": "https://instagram.com",
        "linkedin": "https://linkedin.com",
        "github": "https://github.com",
        "facebook": "https://facebook.com",
        "twitter": "https://x.com",
        "netflix": "https://netflix.com"
    }
    # Play songs on YouTube
    if "song" in command_lower or "play" in command_lower:
        query = command.replace("play", "").replace("song", "").strip()
        if not query:
            query = command
        url = f"https://www.youtube.com/results?search_query={query}"
        webbrowser.open(url)
        return f"Playing {query} on YouTube!"
    
    for site, url in websites.items():
        if site in command_lower:
            webbrowser.open(url)
            return f"Opening {site.title()} for you!"
    
    # File Explorer/Chrome (Windows)
    if any(x in command_lower for x in ["files", "file explorer"]):
        import os; os.system("explorer")
        return "Opening File Explorer!"
    if "chrome" in command_lower:
        import os; os.system("start chrome")
        return "Opening Chrome!"
    
    # Google search for anything else
    if "?" in command or "search" in command_lower:
        query = command.split("search")[-1].strip() or command
        webbrowser.open(f"https://google.com/search?q={query}")
        return f"Searching Google for '{query}'"
    
    return None

def get_gpt_response(command):
    """Get smart GPT response + detect actions"""
    if not GPT_AVAILABLE:
        return "GPT not available - get API key from openai.com"
    
    try:
        # Ask GPT to classify + respond
        prompt = f"""
        You are a helpful voice assistant like Siri. 
        
        Analyze this command: "{command}"
        
        1. If it's time/date: Answer directly
        2. If "open [website/app]": Say "Opening [site]"
        3. For questions: Give short, clear answer (2-3 sentences)
        4. Be friendly and conversational.
        
        Respond ONLY with the spoken answer (no code):
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        return f"AI error: {str(e)}"

def process_command(command):
    print(f"🎤 Heard: {command}")  # Debug
    
    # 1. Check for smart actions first (websites/apps)
    action_response = smart_action(command)
    if action_response:
        speak(action_response)
        return action_response
    
    # 2. Time/Date
    if "time" in command.lower():
        now = datetime.datetime.now().strftime('%I:%M %p')
        response = f"The time is {now}"
    elif "date" in command.lower():
        today = datetime.date.today().strftime('%A, %B %d')
        response = f"Today is {today}"
    else:
        # 3. GPT for everything else (explanations, questions)
        response = get_gpt_response(command)
    
    speak(response)
    return response

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/command", methods=["POST"])
def command():
    try:
        data = request.get_json()
        command = data.get("command", "").strip()
        if not command:
            return jsonify({"response": "Say something!"}), 400
        
        response = process_command(command)
        return jsonify({"response": response})
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"response": f"Oops! Error: {str(e)}"}), 500

if __name__ == "__main__":
    print("🤖 Siri-like Voice Assistant starting...")
    print("💡 Say: 'Open YouTube', 'What is AI?', 'What time?', 'Search Python'...")

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
    