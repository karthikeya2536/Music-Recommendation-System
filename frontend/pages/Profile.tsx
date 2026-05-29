import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Settings, CreditCard, LogOut, Bell, Shield, Smartphone, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { usePlayerStore } from '../store';

import { PageTransition } from '../components/ui/PageTransition';
import ImageWithFallback from '../components/ImageWithFallback';

export default function Profile() {
  const { user, logout, library, clearHistory, updateAvatar } = useAuthStore();
  const { playTrack } = usePlayerStore();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  if (!user) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all listening history?')) {
      clearHistory();
    }
  };

  const handleChangeAvatar = () => {
    const seed = `user_${Date.now()}`;
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    updateAvatar(newAvatar);
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-28 px-8 pb-32 max-w-5xl mx-auto">
        
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-white/10 backdrop-blur-lg text-white px-6 py-3 rounded-xl border border-white/20 shadow-xl flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="text-sonic-accent" />
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-12">
           <div className="relative group" onClick={handleChangeAvatar}>
              <ImageWithFallback src={user.avatar} alt={user.name} className="w-32 h-32 rounded-full border-4 border-sonic-800 shadow-2xl" />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <span className="text-xs font-bold">Change</span>
              </div>
           </div>
           <div className="flex-1 mb-2">
              <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-4xl font-bold text-white">{user.name}</h1>
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black uppercase tracking-wider">
                    {user.plan}
                 </span>
              </div>
              <p className="text-gray-400">{user.email}</p>
           </div>
           <button 
             onClick={logout}
             className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all text-sm font-medium flex items-center gap-2"
           >
             <LogOut size={16} /> Sign Out
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Settings Column */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings size={20} className="text-sonic-accent" /> Account
                 </h3>
                 <div className="space-y-1">
                    <SettingItem icon={CreditCard} label="Manage Subscription" onClick={() => showToast('Subscription management coming soon')} />
                    <SettingItem icon={Shield} label="Privacy & Security" onClick={() => showToast('Privacy settings coming soon')} />
                    <SettingItem icon={Bell} label="Notifications" onClick={() => showToast('Notification settings coming soon')} />
                    <SettingItem icon={Smartphone} label="Connected Devices" onClick={() => showToast('Device management coming soon')} />
                 </div>
              </div>
              
              <div className="bg-gradient-to-br from-sonic-accent/20 to-blue-600/20 rounded-2xl p-6 border border-sonic-accent/20">
                 <h3 className="font-bold mb-2">Upgrade to Family Plan</h3>
                 <p className="text-sm text-gray-300 mb-4">Get 6 Premium accounts for family members living under one roof.</p>
                 <button 
                   onClick={() => showToast('Plan upgrades coming soon')}
                   className="w-full py-2 bg-white text-black font-bold rounded-lg text-sm hover:scale-105 transition-transform"
                 >
                    View Plans
                 </button>
              </div>
           </div>

           {/* History Column */}
           <div className="lg:col-span-2">
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                 <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                       <Clock size={20} className="text-sonic-accent" /> Listening History
                    </h3>
                    <button 
                      onClick={handleClearHistory}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Clear History
                    </button>
                 </div>
                 
                 <div className="max-h-[500px] overflow-y-auto">
                    {library.history.length > 0 ? (
                       library.history.map((track, i) => (
                          <div 
                             key={`${track.id}-${i}`}
                             onClick={() => playTrack(track)}
                             className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                             <ImageWithFallback src={track.coverUrl} className="w-12 h-12 rounded bg-gray-800 object-cover" alt={track.title} />
                             <div className="flex-1">
                                <h4 className="font-medium group-hover:text-sonic-accent transition-colors">{track.title}</h4>
                                <p className="text-xs text-gray-400">{track.artist}</p>
                             </div>
                             <span className="text-xs text-gray-500 font-mono">
                                {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                             </span>
                          </div>
                       ))
                    ) : (
                       <div className="p-12 text-center text-gray-500">
                          <Clock size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No listening history yet.</p>
                          <p className="text-xs mt-2">Start playing music to build your history.</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </PageTransition>
  );
}

const SettingItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
   <button onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-3 text-gray-300 group-hover:text-white">
         <Icon size={18} />
         <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400" />
   </button>
);
