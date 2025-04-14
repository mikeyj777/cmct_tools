import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const FlammableDataViewer = ({ flammableData }) => {
  const [showModal, setShowModal] = useState(false);
  const [minConc, setMinConc] = useState('');
  const [maxConc, setMaxConc] = useState('');
  const [concentrations, setConcentrations] = useState(null);
  
  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (flammableData && flammableData.length > 0) {
      // Calculate min and max concentrations for the color scale
      setConcentrations(flammableData.map(point => parseFloat(point.conc_ppm)));
    }
  }, [flammableData])

  useEffect(() => {
    if (concentrations && concentrations.length > 0) {
      setMinConc(Math.min(...concentrations));
      setMaxConc(Math.max(...concentrations));
    }
  }, [concentrations])
  
  // Handle opening the modal
  const handleOpenModal = () => {
    setShowModal(true);
  };
  
  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  
  // Prepare plot data when needed
  const preparePlotData = () => {
    if (!flammableData || flammableData.length === 0 || !concentrations) return null;
    
    // Extract data points
    const x = flammableData.map(point => point.x);
    const y = flammableData.map(point => point.y);
    const z = flammableData.map(point => point.z);
    
    // Define the plot data with a continuous color scale
    const data = [{
      type: 'scatter3d',
      mode: 'markers',
      x: x,
      y: y,
      z: z,
      marker: {
        size: 4,
        color: concentrations,
        colorscale: 'Jet', // A continuous colorscale: blue-cyan-yellow-red
        colorbar: {
          title: 'Concentration (ppm)',
          thickness: 20,
          len: 0.75,
          tickformat: ',', // This formats numbers with commas for thousands separator
          tickmode: 'auto',
          nticks: 5
        },
        cmin: minConc,
        cmax: maxConc,
        opacity: 0.8
      },
      text: concentrations.map(conc => `Concentration: ${formatNumber(conc)} ppm`),
      hoverinfo: 'text'
    }];
    
    // Define the layout
    const layout = {
      title: 'Flammable Envelope 3D Visualization',
      scene: {
        xaxis: { title: 'X Distance (m)' },
        yaxis: { title: 'Y Distance (m)' },
        zaxis: { title: 'Z Height (m)' }
      },
      margin: { l: 0, r: 0, b: 0, t: 50 },
      annotations: [
        {
          text: 'Note: Colors represent relative concentrations only, not LFL/UFL bounds',
          showarrow: false,
          x: 0,
          y: 0,
          xref: 'paper',
          yref: 'paper',
          xanchor: 'left',
          yanchor: 'bottom',
          font: {
            size: 10,
            color: '#666'
          }
        }
      ]
    };
    
    return { data, layout };
  };
  
  return (
    <div className="fd-viewer-container">
      <button 
        className="fd-viewer-button" 
        onClick={handleOpenModal}
      >
        View Flammable Data
      </button>
      
      {showModal && (
        <div className="fd-viewer-modal-overlay">
          <div className="fd-viewer-modal-content">
            <div className="fd-viewer-modal-header">
              <h3>Flammable Envelope Data</h3>
              <button className="fd-viewer-close-button" onClick={handleCloseModal}>×</button>
            </div>
            <div className="fd-viewer-modal-body">
              <div className="fd-viewer-plot-container">
                {flammableData && flammableData.length > 0 && concentrations ? (
                  <Plot
                    data={preparePlotData().data}
                    layout={preparePlotData().layout}
                    style={{ width: '100%', height: '500px' }}
                    config={{ responsive: true }}
                  />
                ) : (
                  <p>No flammable data available to display</p>
                )}
              </div>
              <div className="fd-viewer-info">
                <h4 className="fd-viewer-info-title">Concentration Information</h4>
                <div className="fd-viewer-concentration-box">
                  <div className="fd-viewer-concentration-gradient"></div>
                  <div className="fd-viewer-concentration-labels">
                    <div className="fd-viewer-conc-label fd-viewer-conc-max">
                      <span className="fd-viewer-conc-value">{minConc && maxConc ? formatNumber(maxConc) : '0'} ppm</span>
                      <span className="fd-viewer-conc-description">Maximum Concentration</span>
                    </div>
                    <div className="fd-viewer-conc-label fd-viewer-conc-min">
                      <span className="fd-viewer-conc-value">{minConc ? formatNumber(minConc) : '0'} ppm</span>
                      <span className="fd-viewer-conc-description">Minimum Concentration</span>
                    </div>
                  </div>
                </div>
                <p className="fd-viewer-info-note">
                  The color gradient represents the concentration levels across the flammable envelope.
                  Blue indicates lower concentrations, while red indicates higher concentrations.
                </p>
                <p className="fd-viewer-info-note fd-viewer-disclaimer">
                  Note: The colors represent relative concentrations only, not LFL/UFL bounds.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlammableDataViewer;