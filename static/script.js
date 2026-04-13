document.getElementById("micBtn").addEventListener("click", startListening);

function startListening() {
    const micBtn = document.getElementById("micBtn");
    const status = document.getElementById("status");
    const response = document.getElementById("response");

    micBtn.classList.add("listening");

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    status.innerText = "Listening... 🎤";

    recognition.start();

    recognition.onresult = function (event) {
        const command = event.results[0][0].transcript;
        status.innerText = "You said: " + command;

        // Show typing animation while waiting
        response.innerHTML = '<span class="typing">Assistant is replying</span>';

        fetch("/command", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ command: command })
        })
        .then(res => res.json())
        .then(data => {
            // Remove typing animation and show final text
            response.innerHTML = data.response;
        })
        .catch(err => {
            response.innerText = "Error: Could not reach the assistant.";
        });
    };

    recognition.onerror = function (event) {
        status.innerText = "Speech recognition error: " + event.error;
        micBtn.classList.remove("listening");
    };

    recognition.onend = function () {
        micBtn.classList.remove("listening");
    };
}