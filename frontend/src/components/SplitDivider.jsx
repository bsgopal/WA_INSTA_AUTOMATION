import React from 'react';

export default function SplitDivider({ isDragging, onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: isDragging ? '8px' : '6px',
        backgroundColor: isDragging ? '#f59e0b' : '#e2e8f0',
        cursor: 'col-resize',
        userSelect: 'none',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.15s, width 0.15s',
        zIndex: 20
      }}
      title="Drag to adjust column widths"
    >
      <div style={{ height: '32px', width: '2px', backgroundColor: '#94a3b8', borderRadius: '9999px' }} />
    </div>
  );
}
