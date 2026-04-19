import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import YeniKayit from './pages/YeniKayit';
import OrganizasyonListe from './pages/OrganizasyonListe';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/yeni" element={<YeniKayit />} />
          <Route path="/liste" element={<OrganizasyonListe />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
