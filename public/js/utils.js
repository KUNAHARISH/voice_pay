const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

/**
 * Load FaceAPI Models
 */
async function loadModels() {
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        console.log("Models Loaded");
    } catch (e) {
        console.error("Error loading models", e);
        alert("Failed to load AI models. Check internet connection.");
    }
}

/**
 * Start Camera feed
 */
async function startVideo(videoElement) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoElement.srcObject = stream;
    } catch (err) {
        console.error("Camera error:", err);
        alert("Please enable camera access.");
        speak("I cannot access your camera. Please check permissions.");
    }
}

/**
 * Text to Speech with Language Support
 */
function speak(text, lang = 'en-US') {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; // Set language

    // Attempt to pick a voice for the lang if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes(lang));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
}

/**
 * Get Face Descriptor
 */
async function getFaceDescriptor(videoElement) {
    // Use TinyFaceDetector for speed (lighter model)
    const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;
    return detection.descriptor;
}

/**
 * Compare two face descriptors (Euclidean Distance)
 * Threshold usually 0.6
 */
function matchFaces(descriptor1, descriptor2) {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance; // Lower is better
}
