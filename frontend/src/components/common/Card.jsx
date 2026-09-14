// src/components/common/Card.jsx
import React from 'react';

const Card = ({ children, className, hover = false }) => {
  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-soft p-6
        ${hover ? 'hover:shadow-medium transition-shadow duration-300' : ''}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
};

export default Card;