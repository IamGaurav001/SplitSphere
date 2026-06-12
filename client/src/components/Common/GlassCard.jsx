import React from 'react';

const GlassCard = ({ children, className = '', onClick, style }) => {
  return (
    <div 
      className={`glass-card animate-fade-in ${className}`} 
      onClick={onClick}
      style={{
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
