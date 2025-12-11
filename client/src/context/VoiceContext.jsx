import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { speak } from '../utils/voiceUtils';

const VoiceContext = createContext();

const COMMANDS = {
    TRANSFER: ['transfer', 'send', 'pampinchu', 'bhejo', 'money', 'paise', 'dabbulu'],
    BILL: ['bill', 'kattu', 'bhar', 'electricity', 'current', 'water', 'gas', 'net', 'wifi', 'dth'],
    BALANCE: ['balance', 'amount', 'entha', 'kitna', 'paise', 'chk', 'check'],
    LOGIN: ['login', 'signin', 'log in', 'sign in', 'aao', 'randi'],
    LOGOUT: ['logout', 'signout', 'po', 'jao'],
    CONFIRM: ['confirm', 'ok', 'sare', 'thik', 'done', 'yes', 'pay'],
    CLEAR: ['clear', 'reset', 'erase', 'empty', 'remove'],
    BACK: ['back', 'go back', 'return', 'cancel', 'piche'],
    HELLO: ['hello', 'hi', 'hey', 'namaste']
};

export const VoiceProvider = ({ children }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lastCommand, setLastCommand] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-IN';

            recognition.onresult = (e) => {
                const latestResult = e.results[e.results.length - 1];
                if (!latestResult) return;

                const text = latestResult[0].transcript;
                setTranscript(text);

                if (latestResult.isFinal) {
                    processCommand(text);
                }
            };

            recognition.onerror = (e) => {
                console.error("Voice Error", e);
                if (e.error === 'not-allowed') {
                    speak("Microphone access denied.");
                    setIsListening(false);
                } else {
                    // Ignore minor errors, rely on onend to restart
                }
            };

            recognition.onend = () => {
                // Auto restart if supposed to be listening
                // Add a small delay to prevent rapid loops
                if (isListening) {
                    setTimeout(() => {
                        try {
                            recognition.start();
                            console.log("Voice restarted");
                        } catch (e) {
                            console.log("Restart prevented", e);
                        }
                    }, 500);
                }
            };

            recognitionRef.current = recognition;
        }
    }, [isListening]);

    const processCommand = (text) => {
        const lower = text.toLowerCase();

        // Direct response for Hello
        if (lower.includes('hello') || lower.includes('hi')) {
            speak("Hello! How can I help you?");
        }

        let type = null;
        for (const [key, keywords] of Object.entries(COMMANDS)) {
            if (keywords.some(k => lower.includes(k))) {
                type = key;
                break;
            }
        }

        setLastCommand({ type, text: lower, timestamp: Date.now() });
    };

    const startListening = () => {
        setIsListening(true);
        try {
            recognitionRef.current?.start();
        } catch (e) {
            console.log("Already started");
        }
    };

    const stopListening = () => {
        setIsListening(false);
        recognitionRef.current?.stop();
    };

    return (
        <VoiceContext.Provider value={{ isListening, transcript, lastCommand, startListening, stopListening, speak }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => useContext(VoiceContext);
