import { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw, User, Calendar, DollarSign, Scissors, UserCheck, LogIn, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { AuditLog, AuditAction } from '../shared/types';

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'appointment.created':   { label: 'Appointment Booked',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    icon: <Calendar className="w-3.5 h-3.5" /> },
  'appointment.updated':   { label: 'Appointment Updated',   color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    icon: <Calendar className="w-3.5 h-3.5" /> },
  'appointment.cancelled': { label: 'Appointment Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: <Calendar className="w-3.5 h-3.5" /> },
  'appointment.deleted':   { label: 'Appointment Deleted',   color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: <Calendar className="w-3.5 h-3.5" /> },
  'customer.created':      { label: 'Customer Added',        color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: <User className="w-3.5 h-3.5" /> },
  'customer.updated':      { label: 'Customer Updated',      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    icon: <User className="w-3.5 h-3.5" /> },
  'customer.deleted':      { label: 'Customer Deleted',      color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: <User className="w-3.5 h-3.5" /> },
  'payment.marked_paid':   { label: 'Payment Collected',     color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: <DollarSign className="w-3.5 h-3.5" /> },
  'payment.refunded':      { label: 'Payment Refunded',      color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: <DollarSign className="w-3.5 h-3.5" /> },
  'payment.undo_refund':   { label: 'Refund Reversed',       color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <DollarSign className="w-3.5 h-3.5" /> },
  'service.created':       { label: 'Service Added',         color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: <Scissors className="w-3.5 h-3.5" /> },
  'service.updated':       { label: 'Service Updated',       color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    icon: <Scissors className="w-3.5 h-3.5" /> },
  'service.deleted':       { label: 'Service Deleted',       color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: <Scissors className="w-3.5 h-3.5" /> },
  'stylist.created':       { label: 'Stylist Added',         color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: <UserCheck className="w-3.5 h-3.5" /> },
  'stylist.updated':       { label: 'Stylist Updated',       color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    icon: <UserCheck className="w-3.5 h-3.5" /> },
  'stylist.deleted':       { label: 'Stylist Deleted',       color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: <UserCheck className="w-3.5 h-3.5" /> },
  'employee.created':      { label: 'Employee Account Created', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', icon: <UserCheck className="w-3.5 h-3.5" /> },
  'auth.login':            { label: 'Logged In',             color: 'text-muted-foreground bg-muted/40 border-border',    icon: <LogIn className="w-3.5 h-3.5" /> },
  'auth.logout':           { label: 'Logged Out',            color: 'text-muted-foreground bg-muted/40 border-border',    icon: <LogIn className="w-3.5 h-3.5" /> },
};

const ROLE_COLORS: Record<string, string> = {
  admin:    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  employee: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  customer: 'bg-green-500/10 text-green-400 border-green-500/20',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const ACTION_CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Appointments', value: 'appointment' },
  { label: 'Customers', value: 'customer' },
  { label: 'Payments', value: 'payment' },
  { label: 'Services', value: 'service' },
  { label: 'Stylists', value: 'stylist' },
  { label: 'Auth', value: 'auth' },
];

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const PER_PAGE = 25;

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setLogs(data as AuditLog[]);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l => {
    const matchCat = category === 'all' || l.action.startsWith(category);
    const matchSearch = !search.trim() ||
      l.actor_name.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Audit Log</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} events recorded</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by person, action, or target…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {ACTION_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                category === cat.value
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log table */}
      <div className="backdrop-blur-xl bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading audit log…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No events found</p>
            <p className="text-xs mt-1">Events will appear here as actions are taken</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Time', 'Action', 'By', 'Role', 'Details'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map(log => {
                  const config = ACTION_CONFIG[log.action] ?? {
                    label: log.action, color: 'text-muted-foreground bg-muted/40 border-border',
                    icon: <Shield className="w-3.5 h-3.5" />
                  };
                  return (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {log.actor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">{log.actor_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${ROLE_COLORS[log.actor_role] ?? 'bg-muted/40 text-muted-foreground border-border'}`}>
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-xs truncate">
                        {log.target}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1.5">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-40 transition-all">← Prev</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-40 transition-all">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
