import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import RadiationAnalysis from './components/RadiationAnalysis';
import './App.css';
import './styles/global.css';

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rad" element={<RadiationAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;