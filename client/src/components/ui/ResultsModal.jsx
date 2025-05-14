import React, {useEffect} from 'react';

const ResultsModal = ({ buildingsWithOverpressure, onClose }) => {
    // Effect to handle escape key press
    
    
    useEffect(() =>{
      if (!buildingsWithOverpressure || buildingsWithOverpressure.length === 0) return;
    }, [buildingsWithOverpressure])
    

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
  
      document.addEventListener('keydown', handleEscape);
  
      // Prevent scrolling on the background when modal is open
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
  
      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = originalStyle;
      };
    }, [onClose]);
  
    // Handle click outside modal to close it
    const handleOutsideClick = (e) => {
      if (e.target.className === 'results-modal-overlay') {
        onClose();
      }
    };
  
    // Stop propagation for clicks inside modal content
    const handleModalContentClick = (e) => {
      e.stopPropagation();
    };
  
    return (
      <div className="results-modal-overlay" onClick={handleOutsideClick}>
        <div className="results-modal-content" onClick={handleModalContentClick}>
          <div className="results-modal-header">
            <h3>Building Overpressure Results</h3>
            <button className="close-button-icon" onClick={onClose}>×</button>
          </div>
  
          <div className="results-modal-body">
            {buildingsWithOverpressure.length > 0 ? (
              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Building Name</th>
                      <th>Occupancy Level</th>
                      <th>VCE Overpressure (psi)</th>
                      <th>PV Burst Overpressure (psi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingsWithOverpressure.map((building, index) => (
                      <tr key={index}>
                        <td>{building.name}</td>
                        <td>{building.occupancy}</td>
                        <td>
                          {building.max_overpressure_psi
                            ? parseFloat(building.max_overpressure_psi).toFixed(2)
                            : 'N/A'}
                        </td>
                        <td>
                          {building.pv_burst_overpressure_psi
                            ? parseFloat(building.pv_burst_overpressure_psi).toFixed(2)
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No building data with overpressure results available.</p>
            )}
          </div>
  
          <div className="results-modal-footer">
            <button className="close-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  export default ResultsModal;