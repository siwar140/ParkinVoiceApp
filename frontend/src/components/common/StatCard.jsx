// src/components/common/StatCard.jsx
import React from 'react';
import Card from './Card';

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'primary',
  subtitle 
}) => {
  const colors = {
    primary: 'border-l-4 border-primary-500',
    success: 'border-l-4 border-green-500',
    danger: 'border-l-4 border-red-500',
    purple: 'border-l-4 border-purple-500',
    orange: 'border-l-4 border-orange-500',
  };

  const valueColors = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <Card className={`${colors[color]} hover-lift`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-3xl font-bold ${valueColors[color]}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-full bg-${color}-50`}>
            <Icon className={`w-6 h-6 text-${color}-500`} />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-2 flex items-center gap-1">
          <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
          <span className="text-xs text-gray-400">vs mois dernier</span>
        </div>
      )}
    </Card>
  );
};

export default StatCard;