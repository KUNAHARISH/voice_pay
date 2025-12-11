import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VoiceProvider } from './context/VoiceContext';
import Loader from './components/Loader';

import VoiceWidget from './components/VoiceWidget';

const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const Transfer = lazy(() => import('./pages/Transfer'));
const BillPay = lazy(() => import('./pages/BillPay'));

function App() {
  return (
    <AuthProvider>
      <VoiceProvider>
        <Router>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardHome />} />
                <Route path="transfer" element={<Transfer />} />
                <Route path="bill" element={<BillPay />} />
              </Route>
            </Routes>
          </Suspense>
          <VoiceWidget />
        </Router>
      </VoiceProvider>
    </AuthProvider>
  );
}

export default App;
