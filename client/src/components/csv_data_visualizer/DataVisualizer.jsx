import React, { useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';

/**
 * DataVisualizer component renders 2D or 3D plots based on selected fields
 * @param {Object} props
 * @param {Array} props.data - The CSV data array
 * @param {Object} props.selections - Currently selected fields for each axis
 * @param {Object} props.logScales - Log scale settings for each axis
 */
const DataVisualizer = ({ data, selections, logScales }) => {
  // Determine what type of plot to show
  const showPlot2D = selections.dependent && selections.independent1 && !selections.independent2;
  const showPlot3D = selections.dependent && selections.independent1 && selections.independent2;

  // Transform data for selected variables
  const getPlotData = () => {
    const { independent1, independent2, dependent } = selections;
    
    if (!dependent || (!independent1 && !independent2)) {
      return [];
    }
    
    // 2D plot data
    if (independent1 && !independent2) {
      return [{
        x: data.map(item => logScales.independent1 && item[independent1] > 0 
          ? Math.log10(item[independent1]) 
          : item[independent1]),
        y: data.map(item => logScales.dependent && item[dependent] > 0 
          ? Math.log10(item[dependent]) 
          : item[dependent]),
        mode: 'markers',
        type: 'scatter',
        marker: {
          color: 'rgb(0, 128, 0)',
          size: 8,
          opacity: 0.8
        },
        name: 'Data Points'
      }];
    }
    
    // 3D plot data
    if (independent1 && independent2) {
      return [{
        x: data.map(item => logScales.independent1 && item[independent1] > 0 
          ? Math.log10(item[independent1]) 
          : item[independent1]),
        y: data.map(item => logScales.independent2 && item[independent2] > 0 
          ? Math.log10(item[independent2]) 
          : item[independent2]),
        z: data.map(item => logScales.dependent && item[dependent] > 0 
          ? Math.log10(item[dependent]) 
          : item[dependent]),
        mode: 'markers',
        type: 'scatter3d',
        marker: {
          color: 'rgb(0, 128, 0)',
          size: 5,
          opacity: 0.8
        }
      }];
    }
    
    return [];
  };

  // Get plot layout configuration
  const getPlotLayout = () => {
    const { independent1, independent2, dependent } = selections;
    
    if (!dependent || (!independent1 && !independent2)) {
      return {};
    }
    
    // Get axis labels
    const xAxisLabel = independent1 ? (logScales.independent1 
      ? `Log(${independent1.replace(/_/g, ' ')})` 
      : independent1.replace(/_/g, ' ')) : '';
    
    const yAxisLabel = independent2 ? (logScales.independent2 
      ? `Log(${independent2.replace(/_/g, ' ')})` 
      : independent2.replace(/_/g, ' ')) : '';
    
    const zAxisLabel = dependent ? (logScales.dependent 
      ? `Log(${dependent.replace(/_/g, ' ')})` 
      : dependent.replace(/_/g, ' ')) : '';
    
    // 2D plot layout
    if (independent1 && !independent2) {
      return {
        title: `${zAxisLabel} vs ${xAxisLabel}`,
        xaxis: {
          title: xAxisLabel
        },
        yaxis: {
          title: zAxisLabel
        },
        margin: { t: 50, r: 30, l: 60, b: 60 },
        autosize: true,
        hovermode: 'closest'
      };
    }
    
    // 3D plot layout
    if (independent1 && independent2) {
      return {
        title: `${zAxisLabel} vs ${xAxisLabel} and ${yAxisLabel}`,
        scene: {
          xaxis: {
            title: xAxisLabel
          },
          yaxis: {
            title: yAxisLabel
          },
          zaxis: {
            title: zAxisLabel
          }
        },
        margin: { t: 50, r: 0, l: 0, b: 0 },
        autosize: true
      };
    }
    
    return {};
  };

  return (
    <div className="csv-data-viewer-right-pane">
      <h3 className="csv-data-viewer-section-title">Data Visualization</h3>
      <div className="csv-data-viewer-plot-container">
        {(!selections.dependent || (!selections.independent1 && !selections.independent2)) && (
          <div className="csv-data-viewer-message-container">
            <div>
              <div style={{fontSize: '50px', marginBottom: '20px'}}>📊</div>
              <div>Select at least one independent variable and one dependent variable to visualize data</div>
            </div>
          </div>
        )}
        
        {(showPlot2D || showPlot3D) && (
          <Plot
            data={getPlotData()}
            layout={getPlotLayout()}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        )}
      </div>
    </div>
  );
};

export default DataVisualizer;