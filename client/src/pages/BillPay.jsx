import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaBolt, FaCheck, FaRotateLeft } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { startVideo, getFaceDescriptor, matchFaces, loadModels } from '../utils/faceUtils';

const BillPay = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { state } = useLocation();
    const type = searchParams.get('type') || 'Electricity';

    const { user, addTransaction } = useAuth();
    const { speak, lastCommand } = useVoice();

    const [step, setStep] = useState(1);
    const [consumerId, setConsumerId] = useState('');
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const videoRef = useRef(null);

    // Initial Load Logic
    useEffect(() => {
        loadModels();
        if (state && state.amount) {
            setAmount(state.amount);
        }
    }, [state]);

    // Handle Amount/ID input via voice
    useEffect(() => {
        if (!lastCommand) return;
        const { text, type } = lastCommand;

        // Number extraction for amount/ID
        const numbers = text.match(/\d+/g);

        if (numbers && step === 1) {
            // Heuristic: If number is short (like amount), set amount. If long, maybe ID.
            // For simplicity, checking context or keywords is better.
            if (text.includes('amount') || text.includes('rupees')) {
                setAmount(numbers.join(''));
            } else if (text.includes('id') || text.includes('number')) {
                setConsumerId(numbers.join(''));
            } else {
                // Default to amount if just a number is said
                if (!amount) setAmount(numbers[0]);
            }
        }

        if (type === 'CONFIRM' || text.includes('confirm')) {
            verifyAndPay();
        }

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
            if (step === 1) {
                setAmount('');
                setConsumerId('');
                speak("Cleared.");
            }
        }

    }, [lastCommand, step]);

    const verifyAndPay = async () => {
        if (!amount || !consumerId) {
            speak("Please enter Consumer ID and Amount.");
            return;
        }

        setVerifying(true);
        speak("Verifying identity for payment.");

        try {
            await new Promise(r => setTimeout(r, 100));
            const descriptor = await getFaceDescriptor(videoRef.current);
            if (!descriptor) {
                setVerifying(false);
                return speak("Face not visible.");
            }

            // Basic matching (assuming user has face data)
            if (user && user.faceDescriptor) {
                const stored = new Float32Array(Object.values(user.faceDescriptor));
                const dist = matchFaces(descriptor, stored);
                if (dist > 0.55) {
                    setVerifying(false);
                    return speak("Face verification failed.");
                }
            }

            setVerifying(false);
            setStep(2); // Move to PIN
            speak("Verified. Enter PIN.");

        } catch (e) {
            console.error(e);
            setVerifying(false);
            speak("Error verifying face.");
        }
    };
    const handlePinSubmit = () => {
        if (pin === '1234') {
            setProcessing(true); // Show processing screen momentarily
            speak("Processing bill payment...");

            setTimeout(() => {
                const amtVal = parseFloat(amount) || 0;

                // Create Transaction Record
                const newTx = {
                    id: Date.now(),
                    type: 'BILL_PAY',
                    description: `Paid ${type} Bill`,
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
                speak(`Bill paid successfully.`);
            }, 1500);
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
                    <h2 style={{ color: '#00BFA5' }}>Bill Paid Successful</h2>
                    <h1 id="success-amount" style={{ fontSize: '3rem', margin: '20px 0' }}>₹{amount}</h1>
                    <p style={{ color: '#666' }}>{type} Bill</p>
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
                {/* Only show camera if verifying face (which is mostly instant here or implicit) */}
                <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', margin: '20px auto', border: '3px solid var(--primary)' }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}></video>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="pin-overlay" style={{ background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pin-container">
                    <h3 style={{ color: 'var(--primary)' }}>Enter UPI PIN</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Paying ₹{amount}</p>
                    <div className="pin-dots">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`pin-dot ${(pin || '').length >= i ? 'filled' : ''}`}></div>
                        ))}
                    </div>
                    <div className="pin-keypad">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} className="pin-key" onClick={() => setPin(prev => ((prev || '').length < 4 ? (prev || '') + n : (prev || '')))}>{n}</button>
                        ))}
                        <button className="pin-key" onClick={() => setPin(prev => (prev || '').slice(0, -1))}><FaRotateLeft /></button>
                        <button className="pin-key" onClick={() => setPin(prev => ((prev || '').length < 4 ? (prev || '') + '0' : (prev || '')))}>0</button>
                        <button className="pin-key" onClick={handlePinSubmit} style={{ background: 'var(--primary)', color: 'white' }}><FaCheck /></button>
                    </div>
                    <button onClick={() => { setStep(1); setPin(''); }} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="view-section">
            <div className="view-header">
                <button className="back-icon" onClick={() => navigate('/dashboard')}><FaArrowLeft /></button>
                <h3>Pay Bill</h3>
            </div>

            <div className="balance-card" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="icon-circle bg-blue" style={{ width: 40, height: 40 }}><FaBolt /></div>
                    <div>
                        <h4 style={{ margin: 0, color: 'var(--secondary)' }}>{type}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-body)' }}>Biller Details</p>
                    </div>
                </div>
            </div>

            <div className="amount-container">
                <div className="input-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Consumer Number / ID</label>
                    <input type="text" placeholder="Enter ID" value={consumerId} onChange={(e) => setConsumerId(e.target.value)} style={{ background: 'white', border: '1px solid var(--border-color)' }} />
                </div>

                <p style={{ marginBottom: '10px' }}>Bill Amount</p>
                <div className="amount-input-wrapper">
                    <span>₹</span>
                    <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <p className="balance-hint">Bank Account: **** 4242</p>
            </div>

            <div className="bottom-action-bar">
                <div className="mini-camera-preview">
                    <video ref={videoRef} autoPlay muted playsInline></video>
                </div>
                <button className="btn-pay" onClick={verifyAndPay} disabled={processing || verifying}>
                    {verifying ? 'Verifying...' : (processing ? 'Processing...' : 'Pay Bill')}
                </button>
            </div>
        </div>
    );
};

export default BillPay;
