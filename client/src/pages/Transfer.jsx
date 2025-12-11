import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaMagnifyingGlass, FaCheck, FaRotateLeft } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { startVideo, getFaceDescriptor, matchFaces, loadModels } from '../utils/faceUtils';

import { CONTACTS } from '../data/contacts';

const Transfer = () => {
    const navigate = useNavigate();
    const { state } = useLocation(); // Get router state
    const { user, updateBalance } = useAuth();
    const { speak, lastCommand } = useVoice();

    const [step, setStep] = useState(1); // 1: Select Contact, 2: Amount, 3: PIN
    const [contact, setContact] = useState(null);
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const videoRef = useRef(null);

    // Filter contacts
    const filteredContacts = CONTACTS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm)
    );

    // Init Logic
    useEffect(() => {
        loadModels();
        // Check for passed state from Dashboard
        if (state) {
            if (state.contactName && !contact) {
                const found = CONTACTS.find(c => c.name.toLowerCase() === state.contactName.toLowerCase());
                if (found) {
                    setContact(found);
                    setStep(2);
                }
            }
            if (state.amount && !amount) {
                setAmount(state.amount);
            }
        }
    }, [state]);

    // Step 2 Logic trigger
    useEffect(() => {
        if (step === 2) {
            // Start mini video for auth
            setTimeout(() => {
                if (videoRef.current) startVideo(videoRef.current);
            }, 500);

            if (contact) {
                if (amount) speak(`Confirm sending ${amount} to ${contact?.name}? Say Pay.`);
                else speak(`Sending to ${contact?.name}. Enter amount.`);
            }
        }
    }, [step, contact, amount]);

    // Voice control for amount and contact selection
    useEffect(() => {
        if (!lastCommand) return;
        const { text, type } = lastCommand;

        console.log("Transfer Voice Command:", text, step);

        if (step === 1) {
            // Fuzzy match against CONTACTS
            const lowerText = text.toLowerCase();
            const found = CONTACTS.find(c => lowerText.includes(c.name.toLowerCase()));

            if (found) {
                selectContact(found);
            } else {
                // Try to find a name from text (simplistic)
                // If user says "Search for John", update search bar
                if (text.includes('search')) {
                    const query = text.replace('search', '').replace('for', '').trim();
                    setSearchTerm(query);
                }
            }
        }

        if (step === 2) {
            // Enhanced Amount Logic
            const numbers = text.match(/\d+/g);
            if (numbers) {
                setAmount(numbers.join(''));
            } else {
                // Handle word-to-number if needed, but basic digit recognition is usually handled by STT
                if (text.includes('hundred')) setAmount('100');
                if (text.includes('thousand')) setAmount('1000');
                if (text.includes('five hundred')) setAmount('500');
            }

            if (type === 'CONFIRM' || text.includes('confirm')) {
                // Strictly confirm only
                verifyAndPay();
            }
        }

        // Global Navigation/Reset within Component
        if (type === 'BACK') {
            if (step > 1) {
                setStep(step - 1);
                speak("Going back.");
            } else {
                speak("Returning to dashboard.");
                navigate('/dashboard');
            }
        }

        if (type === 'CLEAR') {
            if (step === 2) {
                setAmount('');
                speak("Amount cleared.");
            } else if (step === 1) {
                setSearchTerm('');
                speak("Search cleared.");
            }
        }
    }, [lastCommand, step]);

    const selectContact = (c) => {
        setContact(c);
        setStep(2);
        speak(`Selected ${c.name}. Say amount to transfer.`);
    };

    const verifyAndPay = async () => {
        if (!amount) return speak("Please enter amount.");

        setVerifying(true);
        speak("Verifying face identity.");

        try {
            await new Promise(r => setTimeout(r, 100)); // Small UI delay
            const descriptor = await getFaceDescriptor(videoRef.current);
            if (!descriptor) {
                setVerifying(false);
                return speak("Face not visible.");
            }

            if (user && user.faceDescriptor) {
                const stored = new Float32Array(Object.values(user.faceDescriptor));
                const dist = matchFaces(descriptor, stored);

                if (dist > 0.55) {
                    setVerifying(false);
                    return speak("Face mismatch. Verification failed.");
                }
            }

            speak("Face verified. Enter PIN.");
            setVerifying(false);
            setStep(3);
        } catch (e) {
            console.error(e);
            speak("Error verifying face.");
        } finally {
            setVerifying(false);
        }
    };

    const handlePinSubmit = () => {
        if (pin === '1234') {
            setProcessing(true); // Show processing screen momentarily
            speak("Processing payment...");

            setTimeout(() => {
                const amtVal = parseFloat(amount) || 0;

                // Create Transaction Record
                const newTx = {
                    id: Date.now(),
                    type: 'TRANSFER',
                    description: `Sent to ${contact?.name || 'Unknown'}`,
                    amount: amtVal,
                    date: new Date().toLocaleDateString(),
                    status: 'Success'
                };

                if (typeof addTransaction === 'function') {
                    addTransaction(newTx);
                } else {
                    console.error("addTransaction missing", newTx);
                }

                setProcessing(false);
                setSuccess(true);
                speak(`Payment of ${amount} rupees successful.`);
            }, 1500); // Fake delay for realism
        } else {
            speak("Incorrect PIN.");
            setPin('');
        }
    };

    if (success) {
        return (
            <div className="view-section" style={{ height: '100%', minHeight: '60vh', display: 'flex' }}>
                <div className="success-content" style={{ margin: 'auto' }}>
                    <div className="tick-animation" style={{ color: '#00BFA5', fontSize: '3rem', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#E0F2F1' }}><FaCheck /></div>
                    <h2 style={{ color: '#00BFA5' }}>Payment Successful</h2>
                    <h1 id="success-amount" style={{ fontSize: '3rem', margin: '20px 0' }}>₹{amount}</h1>
                    <p style={{ color: '#666' }}>Paid to {contact?.name}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '30px', width: '200px' }}>Done</button>
                </div>
            </div>
        );
    }

    // Processing Overlay
    if (processing) {
        return (
            <div className="view-section" style={{ height: '100%', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '60px', height: '60px', borderTopColor: 'var(--primary)', borderRightColor: 'transparent' }}></div>
                <h3 style={{ marginTop: '20px', color: 'var(--primary)' }}>Processing...</h3>
                <p>Please wait securely</p>
                {/* Only show camera if step is 2 (Identity Verification), otherwise just loader */}
                {step === 2 && (
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', margin: '20px auto', border: '3px solid var(--primary)' }}>
                        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}></video>
                    </div>
                )}
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="pin-overlay">
                <div className="pin-container">
                    <h3 style={{ color: 'var(--primary)' }}>Enter UPI PIN</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Paying ₹{amount}</p>
                    <div className="pin-dots">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`pin-dot ${pin.length >= i ? 'filled' : ''}`}></div>
                        ))}
                    </div>
                    <div className="pin-keypad">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} className="pin-key" onClick={() => setPin(prev => (prev.length < 4 ? prev + n : prev))}>{n}</button>
                        ))}
                        <button className="pin-key" onClick={() => setPin(prev => prev.slice(0, -1))}><FaRotateLeft /></button>
                        <button className="pin-key" onClick={() => setPin(prev => (prev.length < 4 ? prev + '0' : prev))}>0</button>
                        <button className="pin-key" onClick={handlePinSubmit} style={{ background: 'var(--primary)', color: 'white' }}><FaCheck /></button>
                    </div>
                    <button onClick={() => setStep(2)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="view-section">
                <div className="view-header">
                    <button className="back-icon" onClick={() => setStep(1)}><FaArrowLeft /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar small" style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{contact?.name[0]}</div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{contact?.name}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{contact?.mobile}</p>
                        </div>
                    </div>
                </div>

                <div className="amount-container">
                    <p>Enter Amount</p>
                    <div className="amount-input-wrapper">
                        <span>₹</span>
                        <input type="number" placeholder="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <p className="balance-hint">Bank Account: **** 4242</p>
                </div>

                <div className="bottom-action-bar">
                    <div className="mini-camera-preview">
                        <video ref={videoRef} autoPlay muted playsInline></video>
                    </div>
                    <button className="btn-pay" onClick={verifyAndPay} disabled={processing || verifying}>
                        {verifying ? 'Verifying...' : (processing ? 'Processing...' : 'Pay Now')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="view-section">
            <div className="view-header">
                <button className="back-icon" onClick={() => navigate('/dashboard')}><FaArrowLeft /></button>
                <h3>Send Money</h3>
            </div>

            <div className="search-bar-container">
                <FaMagnifyingGlass />
                <input
                    type="text"
                    placeholder="Search name or number"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <h4 className="section-label" style={{ margin: '20px 0 10px' }}>All Contacts</h4>
            <div className="contact-list">
                {filteredContacts.map(c => (
                    <div key={c.id} className="contact-item" onClick={() => selectContact(c)}>
                        <div className="avatar">{c.avatar}</div>
                        <div className="contact-info">
                            <h4>{c.name}</h4>
                            <p>{c.mobile}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Transfer;
