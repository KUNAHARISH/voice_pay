export const speak = (text, lang = 'en-IN') => {
    if (!text) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Attempt to pick a voice for the lang if available
    const voices = window.speechSynthesis.getVoices();
    // Try to find an Indian voice primarily
    let voice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi'));

    if (!voice) {
        voice = voices.find(v => v.lang.includes(lang));
    }

    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
};
