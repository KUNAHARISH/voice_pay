import React, { useState } from 'react';
import { FaShieldHalved, FaUserLock, FaMicrophoneLines, FaXmark } from 'react-icons/fa6';

const SecurityGuide = ({ onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: <FaShieldHalved style={{ fontSize: '3rem', color: '#6366f1' }} />,
            title: "Bank-Grade Security",
            desc: "Voice Pay uses advanced encryption and multi-factor authentication to keep your money safe."
        },
        {
            icon: <FaUserLock style={{ fontSize: '3rem', color: '#10b981' }} />,
            title: "Face & Voice Match",
            desc: "Every transaction requires live Face Verification and Voice Confirmation. Photos won't work."
        },
        {
            icon: <FaMicrophoneLines style={{ fontSize: '3rem', color: '#f59e0b' }} />,
            title: "Noise & Accent Smart",
            desc: "Speak naturally. We confirm every amount and name before sending. Always check the screen."
        }
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex',
            justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                background: '#1e293b', padding: '30px', borderRadius: '20px',
                width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px', background: 'none',
                    border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer'
                }}><FaXmark /></button>

                <div style={{ marginBottom: '20px' }}>
                    {steps[step].icon}
                </div>

                <h2 style={{ color: 'white', marginBottom: '10px' }}>{steps[step].title}</h2>
                <p style={{ color: '#cbd5e1', marginBottom: '30px', lineHeight: '1.5' }}>
                    {steps[step].desc}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '20px' }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: i === step ? '#6366f1' : '#475569'
                        }}></div>
                    ))}
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                        if (step < steps.length - 1) setStep(step + 1);
                        else onClose();
                    }}
                >
                    {step < steps.length - 1 ? 'Next' : 'Got it'}
                </button>
            </div>
        </div>
    );
};

export default SecurityGuide;
