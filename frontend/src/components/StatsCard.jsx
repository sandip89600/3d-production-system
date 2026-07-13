import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, color = 'blue', trend, trendLabel, subtitle }) {
  const colorMap = {
    blue: 'from-blue-600 to-blue-400 shadow-blue-500/20',
    purple: 'from-purple-600 to-purple-400 shadow-purple-500/20',
    emerald: 'from-emerald-600 to-emerald-400 shadow-emerald-500/20',
    amber: 'from-amber-600 to-amber-400 shadow-amber-500/20',
    red: 'from-red-600 to-red-400 shadow-red-500/20',
    cyan: 'from-cyan-600 to-cyan-400 shadow-cyan-500/20',
    pink: 'from-pink-600 to-pink-400 shadow-pink-500/20',
    indigo: 'from-indigo-600 to-indigo-400 shadow-indigo-500/20',
  };

  const bgColorMap = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-red-500/10',
    cyan: 'bg-cyan-500/10',
    pink: 'bg-pink-500/10',
    indigo: 'bg-indigo-500/10',
  };

  const textColorMap = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    pink: 'text-pink-400',
    indigo: 'text-indigo-400',
  };

  return (
    <div className="glass-card p-6 hover:bg-white/8 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColorMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className={`w-6 h-6 ${textColorMap[color]}`} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trend > 0 ? 'bg-emerald-500/10 text-emerald-400' :
            trend < 0 ? 'bg-red-500/10 text-red-400' :
            'bg-slate-500/10 text-slate-400'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-1 animate-count-up">{value ?? '—'}</p>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        {trendLabel && <p className="text-slate-500 text-xs mt-1">{trendLabel}</p>}
      </div>
    </div>
  );
}
