import React, { useState, useEffect } from 'react';
import { FaWifi, FaTriangleExclamation } from 'react-icons/fa6';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            background: '#ef4444',
            color: 'white',
            textAlign: 'center',
            padding: '10px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.9rem'
        }}>
            <FaTriangleExclamation />
            <span>You are offline. Some features may be unavailable.</span>
        </div>
    );
};

export default NetworkStatus;
