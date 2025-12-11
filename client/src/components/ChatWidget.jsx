import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaXmark, FaCommentDots } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';

const ChatWidget = ({ isOpen, toggleChat }) => {
    const { user } = useAuth();
    const { speak, lastCommand } = useVoice();
    const [messages, setMessages] = useState([
        { role: 'bot', text: `Hello ${user?.name?.split(' ')[0] || 'User'}! How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (txt) => {
        const text = txt || input;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text }]);
        setInput('');

        try {
            const res = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            const reply = data.reply || "I'm not sure about that.";

            setMessages(prev => [...prev, { role: 'bot', text: reply }]);
            speak(reply);
        } catch (e) {
            console.error(e);
            const err = "Cannot connect to assistant.";
            setMessages(prev => [...prev, { role: 'bot', text: err }]);
            speak(err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Voice Handler for Chat
    useEffect(() => {
        if (!isOpen || !lastCommand) return;
        const { text, type } = lastCommand;

        // Ignore commands meant for navigation if they are caught here
        // But if user says "Clear", maybe they want to clear chat input?
        // For now, let's treat generic text as chat message if chat is open
        // and it's not a known critical command (like BACK used to close chat)

        if (type === 'BACK') {
            toggleChat(); // Close chat on back
            return;
        }

        // Avoid infinite loops or duplicates - check timestamp if needed, 
        // but here we rely on lastCommand changing.
        // Also avoid re-sending greeting or confirming commands if they overlap
        if (type !== 'HELLO' && type !== 'CONFIRM') {
            // Heuristic: If it's a long sentence or a question, send it.
            handleSend(text);
        }

    }, [lastCommand, isOpen]);

    return (
        <div className="chat-widget-container">
            <div className={`chat-window ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaRobot />
                        <span>Voice Assistant</span>
                    </div>
                    <FaXmark style={{ cursor: 'pointer' }} onClick={toggleChat} />
                </div>
                <div className="chat-body">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-msg ${msg.role}`}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={chatEndRef}></div>
                </div>
                <div className="chat-footer">
                    <input
                        className="chat-input"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="btn-icon-small" onClick={() => handleSend()}>
                        <FaPaperPlane />
                    </button>
                </div>
            </div>

            <button className="chat-toggle-btn" onClick={toggleChat}>
                {isOpen ? <FaXmark /> : <FaCommentDots />}
            </button>
        </div>
    );
};

export default ChatWidget;
