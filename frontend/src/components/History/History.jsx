import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getHistory, deletePrediction } from '../../services/api';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  FunnelIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

const History = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState('all'); // 'all' | 'Sain' | 'Malade'

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette analyse de l\'historique ?')) {
      try {
        await deletePrediction(id);
        setHistory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('Erreur suppression analyse:', err);
      }
    }
  };

  // Filtrage dynamique
  const filteredHistory = history.filter(item => {
    const matchesSearch = (item.patient_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterResult === 'all' || item.result === filterResult;
    return matchesSearch && matchesFilter;
  });

  // Exportation CSV
  const exportToCSV = () => {
    if (filteredHistory.length === 0) return;

    const headers = ['ID,Patient,Date,Statut,Confiance(%),Probabilite(%)'];
    const rows = filteredHistory.map(item => {
      const dateStr = new Date(item.created_at).toLocaleString('fr-FR');
      const name = (item.patient_name || 'Patient Inconnu').replace(/,/g, ' ');
      const conf = (item.confidence * 100).toFixed(1);
      const prob = (item.probability * 100).toFixed(1);
      return `${item.id},"${name}","${dateStr}",${item.result},${conf},${prob}`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historique_analyses_parkinson_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📋 Historique des Analyses</h1>
          <p className="text-sm text-slate-500 mt-1">Consultez, filtrez et meurlez l'historique complet des dépistages vocaux.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exporter (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            <PrinterIcon className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilterResult('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterResult === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tous ({history.length})
          </button>
          <button
            onClick={() => setFilterResult('Sain')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterResult === 'Sain' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🟢 Sains ({history.filter(h => h.result === 'Sain').length})
          </button>
          <button
            onClick={() => setFilterResult('Malade')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterResult === 'Malade' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔴 Malades ({history.filter(h => h.result === 'Malade').length})
          </button>
        </div>
      </div>

      {/* Tableau ou Liste */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">Chargement de l'historique...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            Aucune analyse ne correspond aux critères.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.result === 'Malade' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  }`}></span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {item.patient_name || 'Patient anonyme'}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString('fr-FR')} à {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 max-w-md">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      item.result === 'Malade'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {item.result === 'Malade' ? '🔴 Malade' : '🟢 Sain'}
                    </span>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Confiance : <strong className="text-slate-700">{(item.confidence * 100).toFixed(0)}%</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Supprimer cette analyse"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;