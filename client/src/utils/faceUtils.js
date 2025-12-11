import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export const loadModels = async () => {
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        console.log("Models Loaded");
        return true;
    } catch (e) {
        console.error("Error loading models", e);
        return false;
    }
};

export const startVideo = async (videoElement) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoElement) {
            videoElement.srcObject = stream;
        } else {
            console.error("Video element not found provided to startVideo");
        }
    } catch (err) {
        console.error("Camera error:", err);
        throw err;
    }
};

export const getFaceDescriptor = async (videoElement) => {
    if (!videoElement) return null;

    // Use TinyFaceDetector for speed (lighter model)
    const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;
    return detection.descriptor;
};

export const matchFaces = (descriptor1, descriptor2) => {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance; // Lower is better
};
