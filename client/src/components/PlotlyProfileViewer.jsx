import React from 'react';
import Plot from 'react-plotly.js';

/**
 * PlotlyViewer component for rendering radiation analysis data
 * Uses react-plotly.js for visualization
 * @param {Object} props - Component props
 * @param {Array} props.data - Radiation analysis data to display
 */
const PlotlyProfileViewer = ({ data }) => {
  const plotData = [
    {
      x: data.map(item => item.dist * 3.28084),
      y: data.map(item => item.rad_level_w_m2),
      mode: 'markers',
      type: 'scatter',
      marker: { color: 'rgba(255, 50, 0, 1.0)' },
    },
  ];

  const layout = {
    title: 'Radiation Levels vs Distance',
    xaxis: { title: 'Distance' },
    yaxis: { title: 'Radiation Level (W/m²)' },
  };

  return <Plot data={plotData} layout={layout} />;
};

export default PlotlyProfileViewer;