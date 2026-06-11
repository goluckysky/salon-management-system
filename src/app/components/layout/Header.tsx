import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Search, X, CalendarCheck, DollarSign, UserX, UserPlus, Check, Users, Scissors, CalendarDays, CreditCard, Menu } from 'lucide-react';
import type { AppPage, Customer, Appointment, Service, Stylist } from '../shared/types';
import { notificationStore, type Notification } from '../shared/notifications';

interface HeaderProps {
  currentPage: AppPage;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onNavigate: (page: AppPage) => void;
  customers: Customer[];
  appointments: Appointment[];
  services: Service[];
  stylists: Stylist[];
  onMobileMenuOpen: () => void;
}

const PAGE_TITLES: Record<AppPage, { title: string; subtitle: string }> = {
  dashboard:    { title: 'Dashboard',       subtitle: 'Overview of your salon performance' },
  customers:    { title: 'Customers',       subtitle: 'Manage client profiles and preferences' },
  appointments: { title: 'Appointments',    subtitle: 'Schedule and manage bookings' },
  services:     { title: 'Services',        subtitle: 'Manage your service catalog' },
  payments:     { title: 'Payments',        subtitle: 'Track revenue and transactions' },
  stylists:     { title: 'Stylists',        subtitle: 'Manage your team' },
  portal:       { title: 'Customer Portal', subtitle: 'Book and manage your appointments' },
  audit:        { title: 'Audit Log',        subtitle: 'Full history of all actions taken in the system' },
};

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  appointment:  <CalendarCheck className="w-4 h-4 text-primary" />,
  payment:      <DollarSign className="w-4 h-4 text-green-400" />,
  cancellation: <UserX className="w-4 h-4 text-red-400" />,
  new_customer: <UserPlus className="w-4 h-4 text-cyan-400" />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type SearchResult = {
  id: string;
  label: string;
  sublabel: string;
  page: AppPage;
  icon: React.ReactNode;
};

export function Header({ currentPage, theme, onThemeToggle, onNavigate, customers, appointments, services, stylists, onMobileMenuOpen }: HeaderProps) {
  const info = PAGE_TITLES[currentPage] ?? PAGE_TITLES.dashboard;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ── Search ────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results: SearchResult[] = query.trim().length < 1 ? [] : [
    ...customers
      .filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query))
      .slice(0, 3)
      .map(c => ({ id: c.id, label: c.name, sublabel: c.email, page: 'customers' as AppPage, icon: <Users className="w-3.5 h-3.5 text-primary" /> })),
    ...appointments
      .filter(a => a.customerName.toLowerCase().includes(query.toLowerCase()) || a.serviceName.toLowerCase().includes(query.toLowerCase()) || a.stylistName.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(a => ({ id: a.id, label: a.customerName, sublabel: `${a.serviceName} · ${a.date} ${a.time}`, page: 'appointments' as AppPage, icon: <CalendarDays className="w-3.5 h-3.5 text-cyan-400" /> })),
    ...services
      .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(s => ({ id: s.id, label: s.name, sublabel: `$${s.price} · ${s.duration}min`, page: 'services' as AppPage, icon: <Scissors className="w-3.5 h-3.5 text-violet-400" /> })),
    ...stylists
      .filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.specialty.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(s => ({ id: s.id, label: s.name, sublabel: s.specialty, page: 'stylists' as AppPage, icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" /> })),
  ];

  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { onNavigate(results[selectedIdx].page); setShowSearch(false); setQuery(''); }
    if (e.key === 'Escape') { setShowSearch(false); setQuery(''); }
  };

  // ── Notifications ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(notificationStore.getAll());
    return notificationStore.subscribe(setNotifications);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  const glassStyle = { background: theme === 'dark' ? 'rgba(12,14,28,0.97)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)' };

  return (
    <header className="h-16 backdrop-blur-xl bg-card border-b border-border flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button onClick={onMobileMenuOpen} className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex-shrink-0">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-foreground leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{info.title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{dateStr}</p>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative hidden md:block">
        {!showSearch ? (
          <button
            onClick={() => { setShowSearch(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 border border-border text-muted-foreground text-sm w-52 hover:border-primary/30 transition-colors"
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs">Quick search…</span>
          </button>
        ) : (
          <div className="w-72">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 border border-primary/40 text-foreground text-sm ring-2 ring-primary/20">
              <Search className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search customers, appointments…"
                className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground"
                autoComplete="off"
              />
              {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>}
            </div>

            {results.length > 0 && (
              <div className="absolute top-11 left-0 w-full rounded-xl border border-border shadow-2xl overflow-hidden z-50" style={glassStyle}>
                {results.map((r, i) => (
                  <button
                    key={r.id + r.page}
                    onClick={() => { onNavigate(r.page); setShowSearch(false); setQuery(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? 'bg-primary/15' : 'hover:bg-primary/10'}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.trim().length > 0 && results.length === 0 && (
              <div className="absolute top-11 left-0 w-full rounded-xl border border-border shadow-2xl overflow-hidden z-50 px-4 py-3" style={glassStyle}>
                <p className="text-xs text-muted-foreground text-center">No results for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={panelRef} className="relative">
        <button onClick={() => setShowPanel(s => !s)} className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {showPanel && (
          <div className="absolute right-0 top-12 w-80 rounded-2xl border border-border shadow-2xl z-50 overflow-hidden" style={glassStyle}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && <button onClick={() => notificationStore.markAllRead()} className="text-xs text-primary hover:underline flex items-center gap-1"><Check className="w-3 h-3" /> Mark all read</button>}
                {notifications.length > 0 && <button onClick={() => notificationStore.clear()} className="text-xs text-muted-foreground hover:text-destructive transition-colors"><X className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : notifications.map(n => (
                <div key={n.id} onClick={() => notificationStore.markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-primary/5 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                  <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {NOTIF_ICONS[n.type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(n.timestamp)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={onThemeToggle} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border transition-all" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}