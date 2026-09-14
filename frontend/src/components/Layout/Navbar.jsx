// frontend/src/components/Layout/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfileImageUrl } from '../../services/api';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  MicrophoneIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard', label: 'Accueil', icon: HomeIcon },
  { to: '/patients', label: 'Patients', icon: UserGroupIcon },
  { to: '/consultation', label: 'Consultation', icon: MicrophoneIcon },
  { to: '/history', label: 'Historique', icon: ClipboardDocumentListIcon },
  { to: '/profile', label: 'Profil', icon: UserCircleIcon },
];

const Navbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="ParkinVoice Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <div className="text-lg font-extrabold tracking-tight text-blue-600">
              ParkinVoice
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              diagnosis assistant
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:flex">
            {user?.profile_image ? (
              <img 
                src={getProfileImageUrl(user.profile_image)} 
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover border border-blue-200"
              />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            )}
            {user?.full_name || 'Médecin'}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;