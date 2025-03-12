import React from 'react';

/**
 * Displays a contextual guidance banner for user instructions
 * 
 * @param {Object} props - Component props
 * @param {string} props.text - Text to display in the banner
 * @param {string} props.type - Banner type (default, building, warning, etc.)
 * @param {boolean} props.visible - Whether the banner is visible
 */
const GuidanceBanner = ({ text, type = 'default', visible = true }) => {
  if (!visible || !text) return null;
  
  return (
    <div className={`guidance-banner ${type !== 'default' ? type : ''}`}>
      {text}
    </div>
  );
};

export default GuidanceBanner;