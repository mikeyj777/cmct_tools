import React, { useState } from 'react';

const JsonDataLoader = ({ onDataLoaded, currentData, fileName }) => {
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    
    if (!file) return;
    
    // Check if file is JSON
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setFileError('Please select a valid JSON file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // Validate the JSON data has the expected structure
        if (!parsedData.PrimaryInputs) {
          setFileError('Invalid file format: Missing PrimaryInputs section');
          return;
        }
        
        onDataLoaded(parsedData, file.name);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setFileError('Error parsing JSON file. Please check the file format.');
      }
    };
    
    reader.onerror = () => {
      setFileError('Error reading file');
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="file-upload">
      <label className="file-input-label">
        <span>Upload your hazard study JSON file:</span>
        <span className="file-button">Choose File</span>
        <input 
          type="file" 
          accept=".json" 
          className="file-input" 
          onChange={handleFileChange} 
        />
      </label>
      
      {fileError && (
        <div className="file-error">
          {fileError}
        </div>
      )}
      
      {fileName && (
        <div className="file-name">
          Selected: {fileName}
        </div>
      )}
      
      {currentData && currentData.PrimaryInputs && (
        <div className="json-preview">
          <div>Study ID: {currentData.PrimaryInputs.StudyID}</div>
          <div>Description: {currentData.PrimaryInputs.Description}</div>
          <div>
            Location: {currentData.PrimaryInputs.ApproxLatitude}, 
            {currentData.PrimaryInputs.ApproxLongitude}
          </div>
          <div>Site: {currentData.PrimaryInputs.Site}</div>
        </div>
      )}
    </div>
  );
};

export default JsonDataLoader;