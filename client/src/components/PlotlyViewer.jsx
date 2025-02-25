import React from 'react';
import Plot from 'react-plotly.js';

/**
 * PlotlyViewer component for rendering radiation analysis data
 * Uses react-plotly.js for visualization
 * @param {Object} props - Component props
 * @param {Array} props.data - Radiation analysis data to display
 */
const PlotlyViewer = ({ data }) => {
  // Return early if no data is available
  if (!data || data.length === 0) {
    return null;
  }

  // Create the trace configuration for the plot
  const trace = {
    x: data.map(point => point.z * 3.28084),  // Convert to feet
    y: data.map(point => point.rad_level_w_m2),
    mode: 'markers',
    type: 'scatter',
    marker: {
      color: data.map(point => point.rad_level_w_m2),
      colorscale: [
        [0, 'blue'],
        [0.25, 'green'],
        [0.5, 'yellow'],
        [0.75, 'red'],
        [1, 'pink']
      ],
      size: 10,
      colorbar: {
        title: 'Radiation Level (W/m²)',
        titlefont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 14,
          color: '#334155'
        },
        tickfont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12,
          color: '#64748b'
        }
      }
    }
  };

  // Define the layout configuration
  const layout = {
    title: 'Radiation Analysis',
    titlefont: {
      family: 'system-ui, -apple-system, sans-serif',
      size: 18,
      color: '#334155'
    },
    xaxis: { 
      title: 'Height (ft)',
      titlefont: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 14,
        color: '#334155'
      },
      tickfont: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 12,
        color: '#64748b'
      },
      gridcolor: '#e2e8f0'
    },
    yaxis: { 
      title: 'Radiation Level (W/m²)',
      titlefont: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 14,
        color: '#334155'
      },
      tickfont: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 12,
        color: '#64748b'
      },
      gridcolor: '#e2e8f0'
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    margin: {
      l: 70,
      r: 50,
      t: 60,
      b: 70
    },
    hovermode: 'closest'
  };

  // Define plot configuration options
  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'lasso2d', 
      'select2d', 
      'autoScale2d',
      'hoverClosestCartesian',
      'hoverCompareCartesian'
    ]
  };

  return (
    <div className="plotly-container">
      <Plot 
        data={[trace]} 
        layout={layout} 
        config={config}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        className="plotly-chart"
      />
    </div>
  );
};

export default PlotlyViewer;