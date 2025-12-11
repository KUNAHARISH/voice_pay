import React, { useEffect, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa6';
import { useVoice } from '../context/VoiceContext';

const VoiceWidget = () => {
    const { isListening, transcript, startListening, stopListening } = useVoice();
    const [visibleTranscript, setVisibleTranscript] = useState('');

    useEffect(() => {
        if (transcript) {
            setVisibleTranscript(transcript);
            // Hide after 5s of inactivity
            const timer = setTimeout(() => setVisibleTranscript(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [transcript]);

    const toggle = () => {
        if (isListening) stopListening();
        else startListening();
    };

    return (
        <div className="voice-widget">
            <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={toggle}>
                {isListening ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <div className={`transcript-bubble ${visibleTranscript ? 'visible' : ''}`}>
                {visibleTranscript}
            </div>
        </div>
    );
};

export default VoiceWidget;
