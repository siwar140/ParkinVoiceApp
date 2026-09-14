// src/components/Dashboard/RecentAnalyses.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';

const RecentAnalyses = ({ analyses, loading }) => {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">📋 Dernières analyses</h3>
        <Link to="/history">
          <span className="text-xs text-primary-500 hover:underline cursor-pointer">
            Voir tout →
          </span>
        </Link>
      </div>

      {analyses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Aucune analyse pour le moment
        </p>
      ) : (
        <div className="space-y-3">
          {analyses.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.patient_name || 'Patient non renseigné'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.result === 'Malade'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {item.result}
                </span>
                <span className="text-xs text-gray-400 min-w-[40px] text-right">
                  {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecentAnalyses;