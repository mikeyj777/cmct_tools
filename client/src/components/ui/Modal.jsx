import React from 'react';
import ReactDOM from 'react-dom';
import { ResizableBox } from 'react-resizable';
import PlotlyViewer from './PlotlyViewer'; // Adjust the import path as needed

const Modal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <ResizableBox
        width={800}
        height={600}
        minConstraints={[300, 300]}
        maxConstraints={[1200, 800]}
        className="modal-content"
      >
        <button className="modal-close" onClick={onClose}>Close</button>
        <PlotlyViewer data={data} />
      </ResizableBox>
    </div>,
    document.body
  );
};

export default Modal;