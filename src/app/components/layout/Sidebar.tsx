import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import {
  LayoutDashboard, Users, CalendarDays, Scissors, CreditCard,
  UserCheck, LogOut, ChevronLeft, ChevronRight, Sparkles, Shield, X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle,
} from 'lucide-react';
import type { AppPage, User, Stylist } from '../shared/types';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentUser: User;
  stylists: Stylist[];
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const ALL_NAV_ITEMS: { page: AppPage; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { page: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard className="w-5 h-5" /> },
  { page: 'customers',    label: 'Customers',    icon: <Users className="w-5 h-5" /> },
  { page: 'appointments', label: 'Appointments', icon: <CalendarDays className="w-5 h-5" /> },
  { page: 'services',     label: 'Services',     icon: <Scissors className="w-5 h-5" /> },
  { page: 'payments',     label: 'Payments',     icon: <CreditCard className="w-5 h-5" /> },
  { page: 'stylists',     label: 'Stylists',     icon: <UserCheck className="w-5 h-5" /> },
  { page: 'audit',        label: 'Audit Log',    icon: <Shield className="w-5 h-5" />, adminOnly: true },
];

export function Sidebar({ currentPage, onNavigate, currentUser, stylists, onLogout, collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const [showPwModal, setShowPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleChangePassword = async () => {
    if (!newPw || !confirmPw) { setPwResult({ ok: false, msg: 'Please fill in all fields.' }); return; }
    if (newPw.length < 6) { setPwResult({ ok: false, msg: 'New password must be at least 6 characters.' }); return; }
    if (newPw !== confirmPw) { setPwResult({ ok: false, msg: 'Passwords do not match.' }); return; }
    setPwLoading(true); setPwResult(null);
    // Re-authenticate first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPwResult({ ok: false, msg: 'Could not verify identity.' }); setPwLoading(false); return; }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
    if (signInErr) { setPwResult({ ok: false, msg: 'Current password is incorrect.' }); setPwLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwResult({ ok: false, msg: error.message }); }
    else { setPwResult({ ok: true, msg: 'Password changed successfully!' }); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    setPwLoading(false);
  };

  const openPwModal = () => { setShowPwModal(true); setPwResult(null); setCurrentPw(''); setNewPw(''); setConfirmPw(''); };

  // Calendar colors synced with localStorage
  const storageKey = `calColors_${currentUser.id}`;
  const savedColors = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
  const [calColors, setCalColors] = useState({ myColor: savedColors?.myColor ?? '#8b5cf6', othersColor: savedColors?.othersColor ?? '#06b6d4' });

  const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || currentUser.role === 'admin');
  const linkedStylist = currentUser.role === 'employee' && currentUser.stylistId
    ? stylists.find(s => s.id === currentUser.stylistId) : null;
  const displayName = linkedStylist ? linkedStylist.name : currentUser.name;
  const displayRole = linkedStylist ? linkedStylist.specialty : currentUser.role;
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Close mobile sidebar on navigation
  const handleNavigate = (page: AppPage) => {
    onNavigate(page);
    onMobileClose();
  };

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebar && !sidebar.contains(e.target as Node)) onMobileClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside className={`h-full flex flex-col backdrop-blur-xl bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      isMobile ? 'w-[240px]' : collapsed ? 'w-[70px]' : 'w-[240px]'
    }`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${(!isMobile && collapsed) ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        {(isMobile || !collapsed) && (
          <span className="font-bold text-lg text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Luxe<span className="text-primary">Salon</span>
          </span>
        )}
        {isMobile && (
          <button onClick={() => onMobileClose()} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => handleNavigate(item.page)}
              title={(!isMobile && collapsed) ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${(!isMobile && collapsed) ? 'justify-center' : ''}`}
            >
              <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`}>
                {item.icon}
              </span>
              {(isMobile || !collapsed) && <span>{item.label}</span>}
              {(isMobile || !collapsed) && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <div className="px-2 py-2 border-t border-sidebar-border">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all text-sm"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      )}

      {/* User */}
      <div className={`px-3 py-4 border-t border-sidebar-border flex items-center gap-3 ${(!isMobile && collapsed) ? 'justify-center' : ''}`}>
        <button
          onClick={() => currentUser.role === 'employee' ? openPwModal() : undefined}
          className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold ${currentUser.role === 'employee' ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
          title={currentUser.role === 'employee' ? 'Profile & Settings' : undefined}
        >
          {displayInitials}
        </button>
        {(isMobile || !collapsed) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{displayRole}</p>
          </div>
        )}
        {(isMobile || !collapsed) && (
          <button onClick={onLogout} title="Sign out" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        )}
        {!isMobile && collapsed && (
          <button onClick={onLogout} title="Sign out" className="absolute bottom-4 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-3 h-3" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile overlay + sidebar via portal */}
      {mobileOpen && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onMobileClose} />
          <div id="mobile-sidebar" className="fixed inset-y-0 left-0 z-50 h-screen">
            <SidebarContent isMobile />
          </div>
        </>,
        document.body
      )}

      {/* Employee Profile/Settings Panel */}
      {showPwModal && currentUser.role === 'employee' && createPortal((
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowPwModal(false)}>
          <div className="bg-popover border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Profile header */}
            <div className="bg-gradient-to-br from-primary/20 to-accent/10 px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">My Profile</h3>
                <button onClick={() => setShowPwModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {displayInitials}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{displayName}</p>
                  <p className="text-sm text-primary">{displayRole}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Calendar colors */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Calendar Colors</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'My appointments', key: 'myColor' as const },
                    { label: "Others' appointments", key: 'othersColor' as const },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                      <span className="text-sm text-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-border" style={{ background: calColors[key] }} />
                        <input type="color" value={calColors[key]}
                          onChange={e => {
                            const updated = { ...calColors, [key]: e.target.value };
                            setCalColors(updated);
                            localStorage.setItem(`calColors_${currentUser.id}`, JSON.stringify(updated));
                          }}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Change Password */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Security</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Current Password</label>
                    <div className="relative">
                      <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                      <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">New Password</label>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                      <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Confirm New Password</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                  </div>
                </div>
                {pwResult && (
                  <div className={`mt-2 flex items-start gap-2 p-3 rounded-xl border text-xs ${pwResult.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                    {pwResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {pwResult.msg}
                  </div>
                )}
                {!pwResult?.ok && (
                  <button onClick={handleChangePassword} disabled={pwLoading}
                    className="w-full mt-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {pwLoading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    {pwLoading ? 'Updating…' : 'Update Password'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Desktop sidebar */}
      <div className="hidden md:block h-screen relative z-10 flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}