import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';

// Optional: simple error boundary for dev use
class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('FlammableDataViewer error boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', color: '#b00020' }}>
          <h4>Something went wrong in FlammableDataViewer</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const FlammableDataViewer = ({ flammableData }) => {
  const [showModal, setShowModal] = useState(false);

  // Format number with commas safely
  const formatNumber = (num) => {
    if (!Number.isFinite(num)) return '–';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Derive concentrations from props (memoized)
  const concentrations = useMemo(() => {
    if (!Array.isArray(flammableData) || flammableData.length === 0) return [];
    // Ensure numeric and filter out NaN
    return flammableData
      .map((point) => Number(point.conc_ppm))
      .filter((n) => Number.isFinite(n));
  }, [flammableData]);

  // Compute min/max (memoized)
  const { minConc, maxConc } = useMemo(() => {
    if (concentrations.length === 0) {
      return { minConc: null, maxConc: null };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const n of concentrations) {
      if (n < min) min = n;
      if (n > max) max = n;
    }
    return { minConc: min, maxConc: max };
  }, [concentrations]);

  // Prepare plot inputs (memoized)
  const plotProps = useMemo(() => {
    if (!Array.isArray(flammableData) || flammableData.length === 0 || concentrations.length === 0) {
      return null;
    }

    const x = flammableData.map((p) => p.x);
    const y = flammableData.map((p) => p.y);
    const z = flammableData.map((p) => p.z);

    const data = [
      {
        type: 'scatter3d',
        mode: 'markers',
        x,
        y,
        z,
        marker: {
          size: 4,
          color: concentrations,
          colorscale: 'Jet',
          colorbar: {
            title: 'Concentration (ppm)',
            thickness: 20,
            len: 0.75,
            tickformat: ',',
            tickmode: 'auto',
            nticks: 5,
          },
          // Only set cmin/cmax if we have both
          ...(Number.isFinite(minConc) && Number.isFinite(maxConc)
            ? { cmin: minConc, cmax: maxConc }
            : {}),
          opacity: 0.8,
        },
        text: concentrations.map((conc) => `Concentration: ${formatNumber(conc)} ppm`),
        hoverinfo: 'text',
      },
    ];

    const layout = {
      title: 'Flammable Envelope 3D Visualization',
      scene: {
        xaxis: { title: 'X Distance (m)' },
        yaxis: { title: 'Y Distance (m)' },
        zaxis: { title: 'Z Height (m)' },
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
          font: { size: 10, color: '#666' },
        },
      ],
    };

    return { data, layout };
  }, [flammableData, concentrations, minConc, maxConc]);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const hasData = plotProps && plotProps.data && plotProps.data.length > 0;

  return (
    <SimpleErrorBoundary>
      <div className="fd-viewer-container">
        <button className="fd-viewer-button" onClick={handleOpenModal}>
          View Flammable Data
        </button>

        {showModal && (
          <div className="fd-viewer-modal-overlay">
            <div className="fd-viewer-modal-content">
              <div className="fd-viewer-modal-header">
                <h3>Flammable Envelope Data</h3>
                <button className="fd-viewer-close-button" onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              <div className="fd-viewer-modal-body">
                <div className="fd-viewer-plot-container">
                  {hasData ? (
                    <Plot
                      data={plotProps.data}
                      layout={plotProps.layout}
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
                        <span className="fd-viewer-conc-value">
                          {Number.isFinite(maxConc) ? formatNumber(maxConc) : '0'} ppm
                        </span>
                        <span className="fd-viewer-conc-description">Maximum Concentration</span>
                      </div>
                      <div className="fd-viewer-conc-label fd-viewer-conc-min">
                        <span className="fd-viewer-conc-value">
                          {Number.isFinite(minConc) ? formatNumber(minConc) : '0'} ppm
                        </span>
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
    </SimpleErrorBoundary>
  );
};

export default FlammableDataViewer;
