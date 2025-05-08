import React, { useState, useEffect } from 'react';
import FieldSelection from './FieldSelection';
import DataVisualizer from './DataVisualizer';
import DataTable from './DataTable';

/**
 * Main CsvDataViewer component that manages state and coordinates subcomponents
 */
const CsvDataViewer = () => {
  // State for data and UI
  const [csvData, setCsvData] = useState([]);
  const [fields, setFields] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showFileSelect, setShowFileSelect] = useState(false);
  const [activeTab, setActiveTab] = useState('visualization');
  const [selections, setSelections] = useState({
    independent1: null,
    independent2: null,
    dependent: null
  });
  const [logScales, setLogScales] = useState({
    independent1: false,
    independent2: false,
    dependent: false
  });

  // Load sample data for demo purposes
  useEffect(() => {
    // Sample data to show initially
    const sampleData = [
      { id: 1, substance: "Substance A", average_mw: 120, ave_nbp: 78.5, shi_value: 3.2, shi_times_component_moles: 9.6, vapor_pressure: 12.3, flash_point: 23, toxicity_index: 2.1 },
      { id: 2, substance: "Substance B", average_mw: 155, ave_nbp: 110.2, shi_value: 4.5, shi_times_component_moles: 18.0, vapor_pressure: 8.7, flash_point: 32, toxicity_index: 3.7 },
      { id: 3, substance: "Substance C", average_mw: 180, ave_nbp: 145.6, shi_value: 2.8, shi_times_component_moles: 5.6, vapor_pressure: 5.2, flash_point: 45, toxicity_index: 1.8 },
      { id: 4, substance: "Substance D", average_mw: 95, ave_nbp: 62.3, shi_value: 5.1, shi_times_component_moles: 25.5, vapor_pressure: 18.9, flash_point: 18, toxicity_index: 4.3 },
      { id: 5, substance: "Substance E", average_mw: 210, ave_nbp: 195.7, shi_value: 1.9, shi_times_component_moles: 3.8, vapor_pressure: 2.1, flash_point: 65, toxicity_index: 1.2 }
    ];
    
    setCsvData(sampleData);
    setFileName('sample_data.csv');
    
    // Extract field names from sample data (excluding id and substance)
    if (sampleData.length > 0) {
      const fieldNames = Object.keys(sampleData[0]).filter(key => 
        key !== 'id' && key !== 'substance'
      );
      setFields(fieldNames);
    }
  }, []);

  // Custom CSV parser function (instead of using PapaParse)
  const parseCSV = (text) => {
    try {
      // Split by line breaks
      const lines = text.split(/\r\n|\n/);
      
      // Get headers from first line
      const headers = lines[0].split(',').map(header => header.trim());
      
      // Parse data rows
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = parseCSVLine(lines[i]);
        
        if (values.length !== headers.length) {
          console.warn(`Line ${i} has ${values.length} values, but headers has ${headers.length}`);
          continue; // Skip invalid lines
        }
        
        const row = {};
        headers.forEach((header, index) => {
          // Try to convert to number if possible
          const value = values[index];
          row[header] = !isNaN(value) && value !== '' ? parseFloat(value) : value;
        });
        
        data.push(row);
      }
      
      return { data, meta: { fields: headers } };
    } catch (error) {
      console.error("Error parsing CSV:", error);
      return { data: [], meta: { fields: [] } };
    }
  };
  
  // Helper function to parse a CSV line handling quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      try {
        // Read file content as text
        const content = await readFileContent(file);
        
        // Parse CSV data using custom parser
        const parsedResult = parseCSV(content);
        setCsvData(parsedResult.data);
        
        // Extract field names (excluding id and substance if present)
        if (parsedResult.data.length > 0) {
          const fieldNames = parsedResult.meta.fields.filter(key => 
            key !== 'id' && key !== 'substance'
          );
          setFields(fieldNames);
        }
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }
  };
  
  // Read file content using FileReader API
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e.target.error);
      reader.readAsText(file);
    });
  };
  
  // Open file dialog
  const openFileDialog = () => {
    // Trigger file input click
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) {
      fileInput.click();
    }
    
    // Show file selection dialog (for visual feedback)
    setShowFileSelect(true);
    setTimeout(() => {
      setShowFileSelect(false);
    }, 2000);
  };
  
  // Toggle field selection
  const handleToggleSelection = (field, axis) => {
    setSelections(prev => {
      const newSelections = { ...prev };
      
      // If already selected, deselect it
      if (newSelections[axis] === field) {
        newSelections[axis] = null;
      } else {
        // Otherwise select it and deselect any other selection for this axis
        newSelections[axis] = field;
      }
      
      return newSelections;
    });
  };
  
  // Toggle log scale for axis
  const handleToggleLogScale = (axis) => {
    setLogScales(prev => ({
      ...prev,
      [axis]: !prev[axis]
    }));
  };

  return (
    <div className="csv-data-viewer-app-container">
      {/* Hidden file input */}
      <input 
        type="file" 
        id="csv-file-input"
        accept=".csv" 
        onChange={handleFileSelect} 
        style={{ display: 'none' }}
      />
      
      {/* Banner with File Selection */}
      <div className="csv-data-viewer-banner-container">
        <div>
          <h2 className="csv-data-viewer-banner-title">Substance Hazard Index Visualizer</h2>
          <p className="csv-data-viewer-banner-subtitle">Interactive data analysis tool</p>
        </div>
        <div className="csv-data-viewer-file-info">
          <button className="csv-data-viewer-file-button" onClick={openFileDialog}>
            <span className="csv-data-viewer-file-icon">📁</span> Open CSV File
          </button>
          <div className="csv-data-viewer-file-name">
            <span className="csv-data-viewer-file-icon">📄</span> {fileName}
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="csv-data-viewer-tabs-container">
        <div 
          className={`csv-data-viewer-tab ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </div>
        <div 
          className={`csv-data-viewer-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data Table
        </div>
      </div>
      
      {/* Main Content */}
      <div className="csv-data-viewer-content-container">
        {activeTab === 'visualization' ? (
          <>
            {/* Field Selection Component */}
            <FieldSelection 
              fields={fields}
              selections={selections}
              logScales={logScales}
              onToggleSelection={handleToggleSelection}
              onToggleLogScale={handleToggleLogScale}
            />
            
            {/* Data Visualizer Component */}
            <DataVisualizer 
              data={csvData}
              selections={selections}
              logScales={logScales}
            />
          </>
        ) : (
          /* Data Table Component */
          <DataTable 
            data={csvData}
            fields={fields}
          />
        )}

        {/* File Selection Dialog */}
        {showFileSelect && (
          <div className="csv-data-viewer-file-select-overlay">
            <div className="csv-data-viewer-file-select-dialog">
              <div style={{fontSize: '24px', marginBottom: '10px'}}>📁</div>
              <div style={{fontSize: '18px', fontWeight: '600', marginBottom: '15px'}}>Select CSV File</div>
              <div style={{fontSize: '14px', color: '#666', marginBottom: '15px'}}>Browsing for file...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvDataViewer;