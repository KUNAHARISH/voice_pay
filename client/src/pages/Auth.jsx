import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShapes, FaUnlock, FaUserPlus, FaSpinner } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { loadModels, startVideo, getFaceDescriptor, matchFaces } from '../utils/faceUtils';
import api from '../api/axios';

const Auth = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { speak, lastCommand, startListening, stopListening } = useVoice();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [modelsReady, setModelsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            await loadModels();
            setModelsReady(true);
            if (videoRef.current) {
                await startVideo(videoRef.current);
            }
            speak("Welcome. Please identify yourself.");
            startListening();
        };
        init();
        return () => stopListening();
    }, []);

    // Handle Voice Commands for Login
    useEffect(() => {
        if (!lastCommand) return;
        const { type, text } = lastCommand;

        // Number parsing
        const numberMatch = text.match(/\d+/g);
        if (numberMatch) {
            const num = numberMatch.join('');
            if (num.length >= 5) {
                setMobile(num);
                if (num.length >= 10 && !isLoading) {
                    handleLogin(num);
                }
            }
        }

        if (type === 'LOGIN' && !isLoading) {
            handleLogin();
        }

        if (type === 'CLEAR') {
            setMobile('');
            speak("Cleared.");
        }

        if (type === 'BACK') {
            speak("Going to home.");
            navigate('/');
        }
    }, [lastCommand]);

    const handleLogin = async (overrideMobile) => {
        const mob = overrideMobile || mobile;
        if (!mob) {
            speak("Please enter your mobile number");
            return;
        }

        setIsLoading(true);
        setStatus('Verifying...');
        speak("Verifying face identity.");

        try {
            const descriptor = await getFaceDescriptor(videoRef.current);
            if (!descriptor) {
                speak("Face not detected. Look at the camera.");
                setIsLoading(false);
                return;
            }

            // Lookup User
            const res = await api.post('/user-lookup', { mobile: mob });
            const user = res.data;

            // Match Face
            const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
            const distance = matchFaces(descriptor, storedDescriptor);

            if (distance < 0.55) {
                speak(`Welcome back, ${user.name}`);
                login(user);
                navigate('/dashboard');
            } else {
                speak("Face mismatch. Access denied.");
            }
        } catch (err) {
            console.error(err);
            speak("User not found or error.");
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    const handleRegister = async () => {
        if (!mobile) return speak("Enter mobile number first.");

        setIsLoading(true);
        setStatus('Registering...');
        speak("Registering. Hold still.");

        try {
            const descriptor = await getFaceDescriptor(videoRef.current);
            if (!descriptor) {
                speak("Face not detected.");
                setIsLoading(false);
                return;
            }

            // Capture Image
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const faceImage = canvas.toDataURL('image/jpeg');

            const newUser = {
                mobile,
                name: "User " + mobile.slice(-4),
                faceDescriptor: descriptor,
                voiceSampleUrl: "dummy",
                faceImageUrl: faceImage
            };

            await api.post('/register', newUser);
            speak("Registration successful. You can login now.");
        } catch (err) {
            speak("Registration failed.");
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    return (
        <section className="auth-container">
            <button onClick={() => navigate('/')} className="back-btn"><FaArrowLeft /> Back to Home</button>
            <div className="clean-card auth-card">
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                    <FaShapes /> Voice Pay
                </div>
                <h1>Welcome Back</h1>
                <p className="subtitle">Secure login with Face & Voice</p>

                <div className="camera-wrapper">
                    <video ref={videoRef} autoPlay muted playsInline></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>

                <div className="auth-controls">
                    <div className="input-group">
                        <input
                            type="tel"
                            placeholder="Enter Mobile Number"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>

                    <div className="action-buttons">
                        <button onClick={() => handleLogin()} className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? <><FaSpinner className="fa-spin" /> {status}</> : <><FaUnlock /> Login</>}
                        </button>
                        <button onClick={handleRegister} className="btn btn-secondary" disabled={isLoading}>
                            <FaUserPlus /> Create Account
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Auth;
