import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Home component - C64-style launcher for consequence modeling tools
 * This component serves as the main landing page with a retro interface
 * for accessing the different modeling applications
 */
const CmctLauncher = () => {
  const navigate = useNavigate();
  const [hoveredApp, setHoveredApp] = useState('FLARE STACK SIZING');
  
  useEffect(() => {
    document.body.classList.add('launcher-page');
    
    return () => {
      document.body.classList.remove('launcher-page');
    };
  }, []);

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
    },
    {
      id: 'csv',
      name: 'DATA VIEWER',
      fullName: 'CSV DATA VISUALIZER',
      path: '/csv'
    },
    {
      id: 'disp',
      name: 'DISP TEST',
      fullName: 'DISPERSION TESTER',
      path: '/disp'
    },
    {
      id: 'similar-chemical',
      name: 'SIMILAR CHEM',
      fullName: 'SIMILAR CHEMICAL FINDER',
      path: '/similar-chemical'
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