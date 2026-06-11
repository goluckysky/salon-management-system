import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Users, CalendarCheck, DollarSign,
  Clock, CheckCircle2, XCircle, Star,
} from 'lucide-react';
import type { Appointment, Customer, Payment, Stylist, User } from '../shared/types';

interface DashboardProps {
  appointments: Appointment[];
  customers: Customer[];
  payments: Payment[];
  stylists: Stylist[];
  currentUser: User;
  theme: 'light' | 'dark';
}

const VIOLET = '#8b5cf6';
const CYAN = '#06b6d4';
const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#a78bfa', '#22d3ee', '#c4b5fd'];

function StatCard({
  title, value, subtitle, icon, trend, gradient,
}: {
  title: string; value: string; subtitle: string; icon: React.ReactNode;
  trend?: string; gradient: string;
}) {
  return (
    <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
        {trend && (() => {
          const isNeg = trend.startsWith('-');
          return (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isNeg
                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                : 'text-green-500 bg-green-500/10 border border-green-500/20'
            }`}>
              <TrendingUp className={`w-3 h-3 ${isNeg ? 'rotate-180' : ''}`} /> {trend}
            </span>
          );
        })()}
      </div>
      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function Dashboard({ appointments, customers, payments, stylists, currentUser, theme }: DashboardProps) {
  const isAdmin = currentUser.role === 'admin';
  const [hourFilter, setHourFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const tooltipStyle = theme === 'dark'
    ? { background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: '12px', color: '#ffffff', fontSize: '14px', fontWeight: 700, padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }
    : { background: 'rgba(109,40,217,0.12)', border: '1.5px solid rgba(109,40,217,0.35)', borderRadius: '12px', color: '#1e1b4b', fontSize: '14px', fontWeight: 700, padding: '10px 16px', boxShadow: '0 8px 32px rgba(109,40,217,0.12)' };
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today);
  const completedAppts = appointments.filter(a => a.status === 'completed');
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  // Revenue last 7 days
  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayPayments = payments.filter(p => p.date === dateStr && p.status === 'paid');
    const revenue = dayPayments.reduce((s, p) => s + p.amount, 0);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue,
      appointments: appointments.filter(a => a.date === dateStr).length,
    };
  });

  // Service category breakdown
  const serviceBreakdown = appointments.reduce((acc, a) => {
    const existing = acc.find(x => x.name === a.serviceName);
    if (existing) existing.value++;
    else acc.push({ name: a.serviceName, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value).slice(0, 5);

  // Appointment status breakdown
  const statusData = [
    { name: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length },
    { name: 'Scheduled', value: appointments.filter(a => a.status === 'scheduled').length },
    { name: 'Completed', value: appointments.filter(a => a.status === 'completed').length },
    { name: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  const getDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  // Busiest hours data with filter
  const hourSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
  const hourFilteredAppts = appointments.filter(a => {
    if (a.status === 'cancelled') return false;
    if (hourFilter === 'today') return a.date === today;
    if (hourFilter === 'week') return a.date >= getDate(7);
    if (hourFilter === 'month') return a.date >= getDate(30);
    return true;
  });
  const hourlyData = hourSlots.map(slot => ({
    time: slot.slice(0, 5),
    bookings: hourFilteredAppts.filter(a => a.time === slot).length,
  })).filter(d => d.bookings > 0);
  const hourFilterLabels = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' };

  const recentAppts = [...appointments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // ── Real trend calculations ──────────────────────────────────

  // Today's appointments vs yesterday
  const yesterdayAppts = appointments.filter(a => a.date === getDate(1)).length;
  const todayApptsTrend = yesterdayAppts === 0
    ? todayAppts.length > 0 ? '+' + todayAppts.length : null
    : (() => {
        const diff = todayAppts.length - yesterdayAppts;
        const pct = Math.round((diff / yesterdayAppts) * 100);
        return (pct >= 0 ? '+' : '') + pct + '%';
      })();

  // Customers: this week vs last week
  const thisWeekStart = getDate(7);
  const lastWeekStart = getDate(14);
  const thisWeekCustomers = customers.filter(c => c.createdAt >= thisWeekStart).length;
  const lastWeekCustomers = customers.filter(c => c.createdAt >= lastWeekStart && c.createdAt < thisWeekStart).length;
  const customerTrend = thisWeekCustomers === 0 && lastWeekCustomers === 0
    ? null
    : lastWeekCustomers === 0
    ? thisWeekCustomers > 0 ? '+' + thisWeekCustomers : null
    : (() => {
        const diff = thisWeekCustomers - lastWeekCustomers;
        return (diff >= 0 ? '+' : '') + diff;
      })();

  // Revenue: this week vs last week
  const thisWeekRevenue = payments.filter(p => p.status === 'paid' && p.date >= thisWeekStart).reduce((s, p) => s + p.amount, 0);
  const lastWeekRevenue = payments.filter(p => p.status === 'paid' && p.date >= lastWeekStart && p.date < thisWeekStart).reduce((s, p) => s + p.amount, 0);
  const revenueTrend = lastWeekRevenue === 0
    ? thisWeekRevenue > 0 ? '+' + Math.round(thisWeekRevenue) : null
    : (() => {
        const pct = Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100);
        return (pct >= 0 ? '+' : '') + pct + '%';
      })();

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Today's Appointments"
          value={String(todayAppts.length)}
          subtitle={`${todayAppts.filter(a => a.status === 'confirmed').length} confirmed`}
          icon={<CalendarCheck className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          trend={todayApptsTrend ?? undefined}
        />
        <StatCard
          title="Total Customers"
          value={String(customers.length)}
          subtitle="Active client profiles"
          icon={<Users className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
          trend={customerTrend ?? undefined}
        />
        <StatCard
          title="Revenue Collected"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`$${pendingRevenue} pending`}
          icon={<DollarSign className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          trend={revenueTrend ?? undefined}
        />
        <StatCard
          title="Completed Sessions"
          value={String(completedAppts.length)}
          subtitle={`${stylists.length} active stylists`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue area chart - admin only */}
        {isAdmin && <div className="lg:col-span-2 backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue & Bookings</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="apptGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CYAN} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val, name) => [name === 'revenue' ? `$${val}` : val, name === 'revenue' ? 'Revenue' : 'Bookings']}
              />
              <Area type="monotone" dataKey="revenue" stroke={VIOLET} strokeWidth={2} fill="url(#revGradient)" />
              <Area type="monotone" dataKey="appointments" stroke={CYAN} strokeWidth={2} fill="url(#apptGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>}

        {/* Busiest hours - employees see this next to status, admin sees it below */}
        {!isAdmin && (
          <div className="lg:col-span-2 backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Busiest Hours</h3>
                <p className="text-xs text-muted-foreground">Bookings by time slot</p>
              </div>
              <div className="flex gap-1">
                {(['today','week','month','all'] as const).map(f => (
                  <button key={f} onClick={() => setHourFilter(f)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${hourFilter === f ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:border-primary/20'}`}>
                    {hourFilterLabels[f]}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: VIOLET }} formatter={(val) => [val, 'Bookings']} cursor={false} />
                <Bar dataKey="bookings" fill={CYAN} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status pie */}
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-1">Appointment Status</h3>
          <p className="text-xs text-muted-foreground mb-4">All time breakdown</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="text-foreground font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Busiest hours - admin only, full width below charts */}
      {isAdmin && (
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Busiest Hours</h3>
              <p className="text-xs text-muted-foreground">Total bookings by time slot — {hourFilterLabels[hourFilter].toLowerCase()}</p>
            </div>
            <div className="flex gap-1">
              {(['today','week','month','all'] as const).map(f => (
                <button key={f} onClick={() => setHourFilter(f)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${hourFilter === f ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:border-primary/20'}`}>
                  {hourFilterLabels[f]}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: VIOLET }} formatter={(val) => [val, 'Bookings']} cursor={false} />
              <Bar dataKey="bookings" fill={CYAN} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent appointments */}
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {recentAppts.map(appt => (
              <div key={appt.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {appt.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{appt.customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{appt.serviceName} · {appt.stylistName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{appt.date}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize ${STATUS_COLORS[appt.status]}`}>
                    {appt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top stylists */}
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Top Stylists</h3>
          <div className="space-y-3">
            {stylists.sort((a, b) => b.appointmentsCompleted - a.appointmentsCompleted).map((stylist, i) => (
              <div key={stylist.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {stylist.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{stylist.name}</p>
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      {stylist.rating}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${(stylist.appointmentsCompleted / 900) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stylist.appointmentsCompleted} appts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}