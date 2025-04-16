import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RadiationAnalysis from './components/RadiationAnalysis';
import BlastEffectsMain from './components/BlastEffectsMain';
import EvaporationCalculator from './components/EvaporationCalculator';
import CmctLauncher from './components/CmctLauncher';
import './App.css';
import './styles/global.css';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<CmctLauncher />} />
          <Route path="/rad" element={<RadiationAnalysis />} />
          <Route path="/blast" element={<BlastEffectsMain />} />
          <Route path="/evap" element={<EvaporationCalculator />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;