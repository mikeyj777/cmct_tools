import React from 'react';

/**
 * FieldSelection component displays the variable selection table
 * @param {Object} props
 * @param {Array} props.fields - Array of field names from the CSV
 * @param {Object} props.selections - Current selections for axes
 * @param {Object} props.logScales - Current log scale settings
 * @param {Function} props.onToggleSelection - Callback for selection changes
 * @param {Function} props.onToggleLogScale - Callback for log scale changes
 */
const FieldSelection = ({ 
  fields, 
  selections, 
  logScales, 
  onToggleSelection, 
  onToggleLogScale 
}) => {
  return (
    <div className="csv-data-viewer-left-pane">
      <h3 className="csv-data-viewer-section-title">Variable Selection</h3>
      
      <table className="csv-data-viewer-selection-table">
        <thead>
          <tr>
            <th className="csv-data-viewer-table-header">Field Name</th>
            <th className="csv-data-viewer-table-header">
              Independent Variable 1
              <div className="csv-data-viewer-checkbox-container">
                <input 
                  type="checkbox" 
                  id="log-indep1" 
                  checked={logScales.independent1} 
                  onChange={() => onToggleLogScale('independent1')} 
                />
                <label htmlFor="log-indep1" className="csv-data-viewer-checkbox-label">
                  Log Scale
                </label>
              </div>
            </th>
            <th className="csv-data-viewer-table-header">
              Independent Variable 2
              <div className="csv-data-viewer-checkbox-container">
                <input 
                  type="checkbox" 
                  id="log-indep2" 
                  checked={logScales.independent2} 
                  onChange={() => onToggleLogScale('independent2')} 
                />
                <label htmlFor="log-indep2" className="csv-data-viewer-checkbox-label">
                  Log Scale
                </label>
              </div>
            </th>
            <th className="csv-data-viewer-table-header">
              Dependent Variable
              <div className="csv-data-viewer-checkbox-container">
                <input 
                  type="checkbox" 
                  id="log-dep" 
                  checked={logScales.dependent} 
                  onChange={() => onToggleLogScale('dependent')} 
                />
                <label htmlFor="log-dep" className="csv-data-viewer-checkbox-label">
                  Log Scale
                </label>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={index}>
              <td className="csv-data-viewer-field-cell">
                {field.replace(/_/g, ' ')}
              </td>
              <td 
                className={`csv-data-viewer-selection-cell ${selections.independent1 === field ? 'selected' : ''}`}
                onClick={() => onToggleSelection(field, 'independent1')}
              >
                {selections.independent1 === field ? '✓' : ''}
              </td>
              <td 
                className={`csv-data-viewer-selection-cell ${selections.independent2 === field ? 'selected' : ''}`}
                onClick={() => onToggleSelection(field, 'independent2')}
              >
                {selections.independent2 === field ? '✓' : ''}
              </td>
              <td 
                className={`csv-data-viewer-selection-cell ${selections.dependent === field ? 'selected' : ''}`}
                onClick={() => onToggleSelection(field, 'dependent')}
              >
                {selections.dependent === field ? '✓' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FieldSelection;