// src/components/common/ProgressRing.jsx
import React from 'react';

const ProgressRing = ({ percentage, color = 'blue', size = 80, label }) => {
  const colors = {
    blue: 'text-primary-500',
    green: 'text-green-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
  };

  const strokeColor = colors[color] || colors.blue;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={strokeColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{percentage}%</span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>
    </div>
  );
};

export default ProgressRing;