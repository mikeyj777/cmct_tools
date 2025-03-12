import React, { useEffect } from 'react';

/**
 * Reusable confirmation popup component
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display in the popup
 * @param {string} props.confirmText - Text for the confirm button (optional)
 * @param {string} props.cancelText - Text for the cancel button (optional)
 * @param {Function} props.onConfirm - Function to call when confirm is clicked
 * @param {Function} props.onCancel - Function to call when cancel is clicked
 */
const ConfirmationPopup = ({ 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel 
}) => {
  // Effect to handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);

  return (
    <div className="confirmation-popup">
      <div className="confirmation-content">
        <p>{message}</p>
        <div className="confirmation-buttons">
          <button className="cancel-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;