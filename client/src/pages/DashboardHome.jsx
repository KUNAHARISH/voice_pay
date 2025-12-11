import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCcVisa, FaUser, FaLandmark, FaUserCheck, FaMobileScreen, FaLightbulb, FaTv, FaCreditCard, FaShieldHalved } from 'react-icons/fa6';
import { useVoice } from '../context/VoiceContext';

import { useAuth } from '../context/AuthContext';

const DashboardHome = () => {
    const navigate = useNavigate();
    const { speak, lastCommand } = useVoice();
    const { balance, transactions } = useAuth();
    const [balanceVisible, setBalanceVisible] = useState(false);

    const toggleBalance = () => {
        if (!balanceVisible) {
            speak("Verifying security for balance.");
            // In a real app, do face check here. For now, simulate delay
            setTimeout(() => {
                setBalanceVisible(true);
                speak(`Your balance is ${balance} rupees.`);
            }, 800);
        } else {
            setBalanceVisible(false);
        }
    };

    useEffect(() => {
        if (lastCommand?.type === 'BALANCE') {
            toggleBalance();
        }
    }, [lastCommand]);

    return (
        <div>
            {/* Balance Card */}
            <div className="balance-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span className="label">Total Balance (INR)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <h2 className="balance-amount" style={{ margin: 0 }}>
                                {balanceVisible ? `₹${balance.toLocaleString('en-IN')}` : '••••••'}
                            </h2>
                            <button className="btn-secondary" style={{ border: 'none', color: 'white', padding: '5px' }} onClick={toggleBalance}>
                                {balanceVisible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                            {balanceVisible ? 'Updated just now' : 'Tap eye to view'}
                        </p>
                    </div>
                    <FaCcVisa style={{ fontSize: '2.5rem', opacity: 0.8 }} />
                </div>
            </div>

            {/* Transfer Money Section */}
            <div className="section-block" style={{ marginTop: '30px' }}>
                <h3 className="section-label">Transfer Money</h3>
                <div className="quick-actions-row">
                    <div className="action-item" onClick={() => navigate('transfer')}>
                        <div className="icon-circle bg-blue"><FaUser /></div>
                        <span>To Contact</span>
                    </div>
                    <div className="action-item" onClick={() => navigate('transfer')}>
                        <div className="icon-circle bg-blue"><FaLandmark /></div>
                        <span>To Bank</span>
                    </div>
                    <div className="action-item" onClick={() => navigate('transfer')}>
                        <div className="icon-circle bg-blue"><FaUserCheck /></div>
                        <span>To Self</span>
                    </div>
                    <div className="action-item" onClick={toggleBalance}>
                        <div className="icon-circle bg-blue"><FaLandmark /></div>
                        <span>Check Bal</span>
                    </div>
                </div>
            </div>

            {/* Recharge & Pay Bills */}
            <div className="section-block" style={{ marginTop: '30px' }}>
                <h3 className="section-label">Recharge & Pay Bills</h3>
                <div className="quick-actions-grid">
                    <div className="action-item" onClick={() => navigate('bill?type=Mobile')}>
                        <div className="icon-circle"><FaMobileScreen /></div>
                        <span>Mobile</span>
                    </div>
                    <div className="action-item" onClick={() => navigate('bill?type=Electricity')}>
                        <div className="icon-circle"><FaLightbulb /></div>
                        <span>Electric</span>
                    </div>
                    <div className="action-item" onClick={() => navigate('bill?type=DTH')}>
                        <div className="icon-circle"><FaTv /></div>
                        <span>DTH</span>
                    </div>
                    <div className="action-item" onClick={() => navigate('bill?type=Credit Card')}>
                        <div className="icon-circle"><FaCreditCard /></div>
                        <span>Credit Card</span>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="section-block" style={{ marginTop: '30px' }}>
                <h3 className="section-label">Recent Transactions</h3>
                <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {transactions.length === 0 ? (
                        <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No recent transactions</p>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} style={{
                                background: 'white',
                                padding: '15px',
                                borderRadius: '15px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div className="icon-circle" style={{
                                        width: '40px', height: '40px', fontSize: '1rem',
                                        background: tx.type === 'CREDIT' ? 'rgba(22, 219, 204, 0.1)' : 'rgba(254, 92, 115, 0.1)',
                                        color: tx.type === 'CREDIT' ? 'var(--success)' : 'var(--accent)',
                                        boxShadow: 'none'
                                    }}>
                                        {tx.type === 'CREDIT' ? <FaLandmark /> : <FaCcVisa />}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--secondary)' }}>{tx.description}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>{tx.date}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h4 style={{
                                        margin: 0,
                                        color: tx.type === 'CREDIT' ? 'var(--success)' : 'var(--accent)'
                                    }}>
                                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-light)' }}>{tx.status}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* More Services (Placeholder) */}
            <div className="section-block" style={{ marginTop: '30px', paddingBottom: '80px' }}>
                <h3 className="section-label">More Services (Coming Soon)</h3>
                <div className="quick-actions-row" style={{ opacity: 0.6 }}>
                    <div className="action-item">
                        <div className="icon-circle" style={{ background: '#64748b' }}><FaLandmark /></div>
                        <span>Loans</span>
                    </div>
                    <div className="action-item">
                        <div className="icon-circle" style={{ background: '#64748b' }}><FaShieldHalved /></div>
                        <span>Insurance</span>
                    </div>
                    <div className="action-item">
                        <div className="icon-circle" style={{ background: '#64748b' }}><FaUser /></div>
                        <span>Invest</span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DashboardHome;
