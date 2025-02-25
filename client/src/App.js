import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import RadiationAnalysis from './components/RadiationAnalysis';
import VceMapping from './components/VceMapping';
import './App.css';
import './styles/global.css';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rad" element={<RadiationAnalysis />} />
          <Route path="/vce-map" element={<VceMapping />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;