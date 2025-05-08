import React, { useState, useEffect, useRef } from 'react';

/**
 * DataTable component provides Excel-like filtering functionality
 * @param {Object} props
 * @param {Array} props.data - The CSV data array
 * @param {Array} props.fields - Array of field names from the CSV
 */
const DataTable = ({ data, fields }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const [uniqueValues, setUniqueValues] = useState({});
  const [selectedValues, setSelectedValues] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const filterRef = useRef(null);

  // Initialize filtered data and unique values
  useEffect(() => {
    setFilteredData(data);
    
    // Calculate unique values for each column
    const values = {};
    fields.forEach(field => {
      const fieldValues = new Set();
      data.forEach(row => {
        if (row[field] !== undefined && row[field] !== null) {
          fieldValues.add(String(row[field]));
        }
      });
      values[field] = Array.from(fieldValues).sort();
    });
    setUniqueValues(values);
    
    // Initialize selected values (all selected by default)
    const selected = {};
    fields.forEach(field => {
      selected[field] = values[field].reduce((acc, val) => {
        acc[val] = true;
        return acc;
      }, {});
    });
    setSelectedValues(selected);
  }, [data, fields]);

  // Handle clicks outside of filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setOpenFilterColumn(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Apply filters when activeFilters or data changes
  useEffect(() => {
    if (Object.keys(activeFilters).length === 0) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(row => {
      return Object.entries(activeFilters).every(([field, values]) => {
        return values.includes(String(row[field]));
      });
    });
    
    setFilteredData(filtered);
  }, [activeFilters, data]);

  // Toggle filter dropdown
  const toggleFilter = (column) => {
    setOpenFilterColumn(openFilterColumn === column ? null : column);
    setFilterSearch('');
  };
  
  // Toggle filter value selection
  const toggleFilterValue = (column, value) => {
    setSelectedValues(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        [value]: !prev[column][value]
      }
    }));
  };
  
  // Select all filter values
  const selectAllFilterValues = (column) => {
    const updatedValues = { ...selectedValues };
    uniqueValues[column].forEach(value => {
      updatedValues[column][value] = true;
    });
    setSelectedValues(updatedValues);
  };
  
  // Deselect all filter values
  const deselectAllFilterValues = (column) => {
    const updatedValues = { ...selectedValues };
    uniqueValues[column].forEach(value => {
      updatedValues[column][value] = false;
    });
    setSelectedValues(updatedValues);
  };
  
  // Apply filter
  const applyFilter = (column) => {
    const selectedFilterValues = Object.entries(selectedValues[column])
      .filter(([_, isSelected]) => isSelected)
      .map(([value]) => value);
    
    const updatedFilters = { ...activeFilters };
    
    if (selectedFilterValues.length === uniqueValues[column].length) {
      // If all values are selected, remove the filter
      delete updatedFilters[column];
    } else {
      // Otherwise, set the filter
      updatedFilters[column] = selectedFilterValues;
    }
    
    setActiveFilters(updatedFilters);
    setOpenFilterColumn(null);
  };
  
  // Remove filter
  const removeFilter = (column) => {
    const updatedFilters = { ...activeFilters };
    delete updatedFilters[column];
    setActiveFilters(updatedFilters);
    
    // Reset selected values for this column
    selectAllFilterValues(column);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    
    // Reset all selected values
    const resetSelected = {};
    fields.forEach(field => {
      resetSelected[field] = uniqueValues[field].reduce((acc, val) => {
        acc[val] = true;
        return acc;
      }, {});
    });
    setSelectedValues(resetSelected);
  };
  
  // Get filtered values based on search
  const getFilteredValues = (column) => {
    if (!filterSearch) return uniqueValues[column];
    
    return uniqueValues[column].filter(value => 
      String(value).toLowerCase().includes(filterSearch.toLowerCase())
    );
  };
  
  // Render filter dropdown
  const renderFilterDropdown = (column) => {
    if (openFilterColumn !== column) return null;
    
    const filteredValues = getFilteredValues(column);
    const allSelected = filteredValues.every(value => selectedValues[column][value]);
    
    return (
      <div className="filter-dropdown" ref={filterRef}>
        <div className="filter-dropdown-header">
          <strong>Filter by {column.replace(/_/g, ' ')}</strong>
        </div>
        
        <input 
          className="filter-search"
          type="text"
          placeholder="Search..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
        
        <div className="filter-option">
          <input 
            type="checkbox" 
            id={`select-all-${column}`}
            checked={allSelected}
            onChange={() => allSelected ? deselectAllFilterValues(column) : selectAllFilterValues(column)}
          />
          <label htmlFor={`select-all-${column}`}>(Select All)</label>
        </div>
        
        <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '5px 0' }}>
          {filteredValues.map((value, index) => (
            <div className="filter-option" key={index}>
              <input 
                type="checkbox" 
                id={`${column}-${index}`}
                checked={selectedValues[column][value] || false}
                onChange={() => toggleFilterValue(column, value)}
              />
              <label htmlFor={`${column}-${index}`}>
                {value === '' ? '(Blank)' : value}
              </label>
            </div>
          ))}
        </div>
        
        <div className="filter-actions">
          <button 
            className="filter-button secondary"
            onClick={() => setOpenFilterColumn(null)}
          >
            Cancel
          </button>
          <button 
            className="filter-button"
            onClick={() => applyFilter(column)}
          >
            Apply
          </button>
        </div>
      </div>
    );
  };
  
  // Render active filters bar
  const renderFiltersBar = () => {
    if (Object.keys(activeFilters).length === 0) return null;
    
    return (
      <div className="filters-bar">
        {Object.entries(activeFilters).map(([column, values]) => (
          <div className="active-filter" key={column}>
            {column.replace(/_/g, ' ')}: {values.length} selected
            <span 
              className="remove-filter"
              onClick={() => removeFilter(column)}
            >
              ✕
            </span>
          </div>
        ))}
        <button 
          className="clear-filters"
          onClick={clearAllFilters}
        >
          Clear All Filters
        </button>
      </div>
    );
  };

  return (
    <div className="data-table-container">
      <h3 className="section-title">Data Table</h3>
      
      {renderFiltersBar()}
      
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            {fields.map((field, index) => (
              <th key={index}>
                <div>
                  {field.replace(/_/g, ' ')}
                  <div className="column-filter">
                    <span 
                      className={`filter-icon ${activeFilters[field] ? 'active' : ''}`}
                      onClick={() => toggleFilter(field)}
                    >
                      🔍
                    </span>
                    {renderFilterDropdown(field)}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>{rowIndex + 1}</td>
              {fields.map((field, colIndex) => (
                <td key={colIndex}>
                  {row[field] !== undefined && row[field] !== null ? String(row[field]) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredData.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No data matching current filters
        </div>
      )}
      
      <div style={{ padding: '10px', fontSize: '13px', color: '#666' }}>
        Showing {filteredData.length} of {data.length} rows
      </div>
    </div>
  );
};

export default DataTable;