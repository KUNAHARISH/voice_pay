import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShapes, FaArrowRight, FaFingerprint, FaBolt, FaLock, FaUserShield, FaServer, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6';
import { useVoice } from '../context/VoiceContext';

const Landing = () => {
    const navigate = useNavigate();
    const { speak } = useVoice();

    const goToAuth = () => {
        speak("Loading authentication.");
        navigate('/auth');
    };

    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="logo">
                    <FaShapes /> Voice Pay
                </div>
            </nav>

            <div className="hero-content">
                <div className="hero-text-block">
                    <h1 className="hero-title">Experience the <br /> <span className="text-gradient">Future of Payments</span></h1>
                    <p className="hero-subtitle">Secure, fast, and hands-free banking powered by your unique voice and face.</p>
                    <button onClick={goToAuth} className="btn btn-primary btn-lg">
                        Get Started <FaArrowRight />
                    </button>
                </div>
                <div className="hero-image-block">
                    <img src="/img/hero.png" alt="Voice Pay Hero" className="hero-img" onError={(e) => e.target.style.display = 'none'} />
                </div>
            </div>

            <div className="features-row">
                <div className="feature-item">
                    <FaFingerprint />
                    <h3>Biometric Security</h3>
                    <p>Advanced face and voice recognition.</p>
                </div>
                <div className="feature-item">
                    <FaBolt />
                    <h3>Lightning Fast</h3>
                    <p>Transfer money in seconds.</p>
                </div>
            </div>

            <div className="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-grid">
                    <div className="step-card">
                        <span className="step-num">1</span>
                        <h4>Register</h4>
                        <p>Sign up with your mobile number and face.</p>
                    </div>
                    <div className="step-card">
                        <span className="step-num">2</span>
                        <h4>Login</h4>
                        <p>Seamlessly access your account using just your face.</p>
                    </div>
                    <div className="step-card">
                        <span className="step-num">3</span>
                        <h4>Voice Command</h4>
                        <p>Say "Transfer money" or "Pay Bill" to bank hands-free.</p>
                    </div>
                </div>
            </div>

            <div className="security-section">
                <h2 className="section-title">Bank-Grade Security</h2>
                <div className="security-grid">
                    <div className="security-item">
                        <FaLock />
                        <div>
                            <h4>End-to-End Encryption</h4>
                            <p>Your voice and face data are encrypted instantly.</p>
                        </div>
                    </div>
                    <div className="security-item">
                        <FaUserShield />
                        <div>
                            <h4>Identity Protection</h4>
                            <p>Biometric spoofing detection ensures only YOU can login.</p>
                        </div>
                    </div>
                    <div className="security-item">
                        <FaServer />
                        <div>
                            <h4>24/7 Monitoring</h4>
                            <p>Continuous fraud detection for every transaction.</p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="landing-footer">
                <div className="footer-links">
                    <span><FaTwitter /></span>
                    <span><FaInstagram /></span>
                    <span><FaLinkedin /></span>
                </div>
                <p>&copy; 2024 Voice Pay. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;
