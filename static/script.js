// document.getElementById("micBtn").addEventListener("click", startListening);

// function startListening() {
//     const micBtn = document.getElementById("micBtn");
//     const status = document.getElementById("status");
//     const response = document.getElementById("response");

//     micBtn.classList.add("listening");

//     const SpeechRecognition =
//         window.SpeechRecognition || window.webkitSpeechRecognition;

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-US";
//     recognition.continuous = false;
//     recognition.interimResults = false;

//     status.innerText = "Listening... 🎤";

//     recognition.start();

//     recognition.onresult = function (event) {
//         const command = event.results[0][0].transcript;
//         status.innerText = "You said: " + command;

//         // Show typing animation while waiting
//         response.innerHTML = '<span class="typing">Assistant is replying</span>';

//         fetch("/command", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ command: command })
//         })
//         .then(res => res.json())
//         // .then(data => {
//         //     // Remove typing animation and show final text
//         //     response.innerHTML = data.response;
//         // })
//         // .catch(err => {
//         //     response.innerText = "Error: Could not reach the assistant.";
//         // });
//         .then(data => {
//     response.innerHTML = data.response;

//     // 🔊 SPEAK IN BROWSER
//     const speech = new SpeechSynthesisUtterance(data.response);
//     speech.lang = "en-US";
//     speech.rate = 1;
//     speech.pitch = 1;

//     window.speechSynthesis.cancel(); // stop previous
//     window.speechSynthesis.speak(speech);
// })
//     };

//     recognition.onerror = function (event) {
//         status.innerText = "Speech recognition error: " + event.error;
//         micBtn.classList.remove("listening");
//     };

//     recognition.onend = function () {
//         micBtn.classList.remove("listening");
//     };
// }


// ==============================
// 🎤 ELEMENTS
// ==============================
const micBtn = document.getElementById("micBtn");
const status = document.getElementById("status");
const response = document.getElementById("response");

const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

const image = document.getElementById("aiImage");

// ==============================
// 🎨 CANVAS SETUP
// ==============================
canvas.width = 400;
canvas.height = 200;

// ==============================
// 🔊 AUDIO VARIABLES
// ==============================
let audioContext, analyser, dataArray;
let animationId;

// ==============================
// 🎤 START VOICE EFFECTS
// ==============================
async function startVoiceEffects() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        animate();
    } catch (err) {
        console.error("Mic error:", err);
        alert("Microphone access denied");
    }
}

// ==============================
// 🌊 ANIMATION LOOP
// ==============================
function animate() {
    animationId = requestAnimationFrame(animate);

    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let sum = 0;

    // 🌊 Draw waveform
    for (let i = 0; i < dataArray.length; i++) {
        let value = dataArray[i];
        sum += value;

        let x = (i / dataArray.length) * canvas.width;
        let y = canvas.height - value;

        ctx.fillStyle = "#ff00cc";
        ctx.fillRect(x, y, 2, 2);
    }

    // 🎯 Calculate volume
    let volume = sum / dataArray.length;

    // ==============================
    // 🤖 IMAGE REACTION
    // ==============================
    let scale = 1 + volume / 300;
    let glow = volume / 2;

    image.style.transform = `scale(${scale})`;
    image.style.filter = `drop-shadow(0 0 ${glow}px #ff00cc)`;

    // Glow pulse when speaking
    if (volume > 20) {
        image.classList.add("glow");
    } else {
        image.classList.remove("glow");
    }
}

// ==============================
// 🛑 STOP EFFECTS
// ==============================
function stopVoiceEffects() {
    cancelAnimationFrame(animationId);

    if (audioContext) {
        audioContext.close();
    }
}

// ==============================
// 🎤 MAIN LISTEN FUNCTION
// ==============================
micBtn.addEventListener("click", startListening);

function startListening() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Use Google Chrome");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    micBtn.classList.add("listening");
    status.innerText = "Listening... 🎤";

    // 🎬 Start visual effects
    startVoiceEffects();

    recognition.start();

    // ==============================
    // 🎤 RESULT
    // ==============================
    recognition.onresult = function (event) {
        const command = event.results[0][0].transcript;

        console.log("YOU SAID:", command);

        status.innerText = "You said: " + command;
        response.innerText = "Thinking...";

        fetch("/command", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ command: command })
        })
        .then(res => res.json())
        .then(data => {
            console.log("SERVER:", data);

            response.innerText = data.response;

            // 🔊 SPEAK IN BROWSER
            const speech = new SpeechSynthesisUtterance(data.response);
            speech.lang = "en-US";

            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(speech);
        })
        .catch(err => {
            console.error("Fetch error:", err);
            response.innerText = "❌ Server error";
        });
    };

    // ==============================
    // ❌ ERROR
    // ==============================
    recognition.onerror = function (event) {
        console.error("Speech error:", event.error);
        status.innerText = "Error: " + event.error;
    };

    // ==============================
    // 🛑 END
    // ==============================
    recognition.onend = function () {
        micBtn.classList.remove("listening");
        status.innerText = "Click and speak";

        stopVoiceEffects();
    };
}