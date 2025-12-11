import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(12500.50); // Initial mock balance
    const [transactions, setTransactions] = useState([
        { id: 1, type: 'DEBIT', description: 'Grocery Store', amount: 450, date: '12/12/2025', status: 'Success' },
        { id: 2, type: 'CREDIT', description: 'Salary', amount: 25000, date: '01/12/2025', status: 'Success' }
    ]);

    useEffect(() => {
        const storedUser = localStorage.getItem('voice_pay_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('voice_pay_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('voice_pay_user');
    };

    const updateBalance = (amount) => {
        setBalance(prev => prev - amount);
    };

    const addTransaction = (tx) => {
        setTransactions(prev => [tx, ...prev]);
        if (tx.amount) updateBalance(tx.amount);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, balance, transactions, addTransaction }}>
            {children}
        </AuthContext.Provider>
    );
};
