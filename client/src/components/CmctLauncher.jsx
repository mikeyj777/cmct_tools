import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

/**
 * Home component - C64-style launcher for consequence modeling tools
 * This component serves as the main landing page with a retro interface
 * for accessing the different modeling applications
 */
const CmctLauncher = () => {
  const navigate = useNavigate();
  const [hoveredApp, setHoveredApp] = useState('FLARE STACK SIZING');
  
  // Program definitions with routing paths
  const programs = [
    {
      id: 'rad',
      name: 'FLARE STACK',
      fullName: 'FLARE STACK SIZING',
      path: '/rad'
    },
    {
      id: 'blast',
      name: 'EXPLOSIONS',
      fullName: 'BLAST EFFECTS',
      path: '/blast'
    },
    {
      id: 'evap',
      name: 'LAB HOOD',
      fullName: 'LAB HOOD EVAPORATION',
      path: '/evap'
    }
  ];
  
  // Update banner when hovering over program icon
  const handleMouseEnter = (fullName) => {
    setHoveredApp(fullName);
  };
  
  return (
    <div className="c64-container">
      <div className="c64-screen">
        <div className="c64-scanlines"></div>
        
        <header className="c64-header">
          <h1>CONSEQUENCE MODELING</h1>
          <div className="c64-line"></div>
        </header>
        
        <div className="c64-content">
          <p className="c64-intro">SELECT PROGRAM TO RUN:</p>
          
          <div className="c64-programs-container">
            {programs.map((program) => (
              <div 
                key={program.id} 
                className="c64-program-wrapper"
                onMouseEnter={() => handleMouseEnter(program.fullName)}
              >
                <div 
                  className="c64-program-box" 
                  onClick={() => navigate(program.path)}
                >
                  <div className={`c64-program-icon icon-${program.id}`}></div>
                </div>
                <div className="c64-program-name">{program.name}</div>
              </div>
            ))}
          </div>
          
          <div className="c64-banner">
            <p className="c64-banner-instruction">&gt; CLICK ON ICON TO RUN APPLICATION</p>
            <p className="c64-banner-app">&gt; {hoveredApp}</p>
          </div>
        </div>
        
        <footer className="c64-footer">
          <div className="c64-line"></div>
          <p className="c64-ready">READY.</p>
        </footer>
      </div>
    </div>
  );
};

export default CmctLauncher;