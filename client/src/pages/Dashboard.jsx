import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaShapes, FaPowerOff, FaCircleQuestion } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import ChatWidget from '../components/ChatWidget';
import NetworkStatus from '../components/NetworkStatus';
import SecurityGuide from '../components/SecurityGuide';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { lastCommand, speak, startListening, isListening } = useVoice();
    const navigate = useNavigate();
    const location = useLocation();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
        } else {
            // Ensure voice is active when entering dashboard
            if (!isListening) {
                try { startListening(); } catch (e) { }
            }
        }
    }, [user, navigate]);

    // Global Voice Command Handler for Dashboard
    useEffect(() => {
        if (!lastCommand) return;
        const { type, text } = lastCommand;

        console.log("Global Command:", type, text);

        // Smart Parsing for Shortcuts
        const lowerText = text.toLowerCase();

        // --- HELP / Chatbot Logic ---
        if (text.includes('help') || lowerText.includes('support')) {
            setIsChatOpen(true);
            speak("How can I help you?");
            return;
        }

        // --- Transfer Logic ---
        // Prevent triggering global transfer logic if already on the transfer page (handled by Transfer.jsx)
        if (!location.pathname.includes('/transfer')) {
            if (type === 'TRANSFER' || lowerText.includes('transfer') || lowerText.includes('send')) {
                let amount = null;
                let contactName = null;

                // Extract Amount
                const nums = text.match(/\d+/g);
                if (nums) amount = nums[0];
                else if (text.includes('hundred')) amount = 100;

                // Extract Name Logic (simplified)
                const toIndex = lowerText.indexOf('to');
                if (toIndex > -1) {
                    const afterTo = lowerText.substring(toIndex + 3).trim();
                    const possibleName = afterTo.split(' ')[0];
                    if (possibleName.length > 2) {
                        contactName = possibleName.charAt(0).toUpperCase() + possibleName.slice(1);
                    }
                }

                speak(amount ? `Opening transfer of ${amount}.` : "Opening transfer.");
                navigate('/dashboard/transfer', { state: { amount, contactName } });
                return;
            }
        }

        // --- Bill Logic ---
        // Prevent triggering global bill logic if already on the bill page
        if (!location.pathname.includes('/bill')) {
            if (type === 'BILL' || lowerText.includes('bill')) {
                let amount = null;
                const nums = text.match(/\d+/g);
                if (nums) amount = nums[0];

                speak(amount ? `Opening bill payment of ${amount}.` : "Opening bill payments.");
                navigate('/dashboard/bill', { state: { amount } });
                return;
            }
        }

        // --- Standard Navigation ---
        else if (type === 'BALANCE' || lowerText.includes('balance')) {
            if (location.pathname !== '/dashboard') navigate('/dashboard');
        } else if (type === 'LOGOUT') {
            speak("Logging out.");
            logout();
            navigate('/');
        }
    }, [lastCommand, navigate, logout, speak]);

    return (
        <div className="dashboard-grid">
            <NetworkStatus />
            {showSecurity && <SecurityGuide onClose={() => setShowSecurity(false)} />}

            <aside className="sidebar">
                <div className="logo" style={{ marginBottom: '40px' }}>
                    <FaShapes /> Voice Pay
                </div>

                <div style={{ padding: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '10px' }}>Say <strong>"Help"</strong> to open Assistant.</p>
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px' }}>
                    <button onClick={() => setShowSecurity(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}>
                        <FaCircleQuestion /> Security Tips
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="user-header">
                    <div>
                        <h2 id="user-greeting">Hello, {user?.name}</h2>
                        <p style={{ color: 'var(--text-body)' }}>Welcome back</p>
                    </div>
                    <div className="nav-status">
                        <button className="btn btn-secondary" onClick={logout}>
                            <FaPowerOff />
                        </button>
                    </div>
                </header>

                <Outlet />
            </main>

            {/* Floating Widgets */}
            <ChatWidget isOpen={isChatOpen} toggleChat={() => setIsChatOpen(!isChatOpen)} />
        </div>
    );
};

export default Dashboard;
