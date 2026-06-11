import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User as UserIcon, Scissors, Settings, Palette } from 'lucide-react';
import { ThemedSelect } from '../ui/ThemedSelect';
import type { Appointment, Customer, Stylist, Service, AppointmentStatus, User } from '../shared/types';
import { TIME_SLOTS } from '../shared/data';

interface AppointmentsPageProps {
  appointments: Appointment[];
  customers: Customer[];
  stylists: Stylist[];
  services: Service[];
  currentUser: User;
  onAdd: (a: Omit<Appointment, 'id'>) => void;
  onUpdate: (a: Appointment) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-400',
  confirmed: 'bg-green-400',
  completed: 'bg-violet-400',
  cancelled: 'bg-red-400',
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function AppointmentsPage({ appointments, customers, stylists, services, currentUser, onAdd, onUpdate, onDelete }: AppointmentsPageProps) {
  const isAdmin = currentUser.role === 'admin';
  const [sortCol, setSortCol] = useState<'date' | 'customer' | 'stylist' | 'service' | 'price' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortIcon = (col: typeof sortCol) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
  const isEmployee = currentUser.role === 'employee';
  const myId = currentUser.stylistId;

  // Per-employee color preferences stored in localStorage
  const storageKey = `calColors_${currentUser.id}`;
  const savedColors = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } })();
  const [myColor, setMyColor] = useState<string>(savedColors?.myColor ?? '#8b5cf6');
  const [othersColor, setOthersColor] = useState<string>(savedColors?.othersColor ?? '#06b6d4');
  const [showColorSettings, setShowColorSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ myColor, othersColor }));
  }, [myColor, othersColor, storageKey]);

  const isMyAppt = (appt: { stylistId: string }) => isEmployee && myId ? appt.stylistId === myId : false;
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    customerId: '',
    stylistId: '',
    serviceId: '',
    date: today.toISOString().split('T')[0],
    time: '10:00',
    notes: '',
    status: 'scheduled' as AppointmentStatus,
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const numDays = daysInMonth(calYear, calMonth);
  const firstDay = firstDayOfMonth(calYear, calMonth);

  const fmt = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${calYear}-${m}-${d}`;
  };

  const apptsByDate = (dateStr: string) => appointments.filter(a => a.date === dateStr);
  const selectedAppts = apptsByDate(selectedDate);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const openAdd = () => {
    setEditingAppt(null);
    const defaultStylistId = currentUser.role === 'employee' && currentUser.stylistId ? currentUser.stylistId : '';
    setForm({ customerId: '', stylistId: defaultStylistId, serviceId: '', date: selectedDate, time: '10:00', notes: '', status: 'scheduled' });
    setShowModal(true);
  };

  const openEdit = (a: Appointment) => {
    setEditingAppt(a);
    setForm({ customerId: a.customerId, stylistId: a.stylistId, serviceId: a.serviceId, date: a.date, time: a.time, notes: a.notes, status: a.status });
    setShowModal(true);
  };

  const handleSave = () => {
    const customer = customers.find(c => c.id === form.customerId);
    const stylist = stylists.find(s => s.id === form.stylistId);
    const service = services.find(s => s.id === form.serviceId);
    if (!customer || !stylist || !service) return;
    const payload: Omit<Appointment, 'id'> = {
      customerId: form.customerId,
      customerName: customer.name,
      stylistId: form.stylistId,
      stylistName: stylist.name,
      serviceId: form.serviceId,
      serviceName: service.name,
      date: form.date,
      time: form.time,
      notes: form.notes,
      status: form.status,
      price: service.price,
    };
    if (editingAppt) onUpdate({ ...editingAppt, ...payload });
    else onAdd(payload);
    setShowModal(false);
  };

  const isToday = (dateStr: string) => dateStr === today.toISOString().split('T')[0];

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</h3>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Color settings toggle - employees only */}
          {isEmployee && (
            <div className="mb-3">
              <button
                onClick={() => setShowColorSettings(s => !s)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                {showColorSettings ? 'Hide color settings' : 'Calendar colors'}
              </button>
              {showColorSettings && (
                <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">My appointments</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: myColor }} />
                      <input type="color" value={myColor} onChange={e => setMyColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Others' appointments</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: othersColor }} />
                      <input type="color" value={othersColor} onChange={e => setOthersColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: numDays }, (_, i) => {
              const day = i + 1;
              const dateStr = fmt(day);
              const dayAppts = apptsByDate(dateStr);
              const isSelected = dateStr === selectedDate;
              const isTodayDate = isToday(dateStr);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex flex-col items-center justify-center h-9 w-full rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : isTodayDate
                      ? 'ring-1 ring-primary/40 text-primary'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  {day}
                  {dayAppts.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {isEmployee
                        ? dayAppts.slice(0, 4).map((a, j) => (
                            <div
                              key={j}
                              className="w-1 h-1 rounded-full"
                              style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : (isMyAppt(a) ? myColor : othersColor) }}
                            />
                          ))
                        : dayAppts.slice(0, 3).map((_, j) => (
                            <div key={j} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-primary/60'}`} />
                          ))
                      }
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day appointments */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-xs text-muted-foreground">{selectedAppts.length} appointment{selectedAppts.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Book
            </button>
          </div>

          {selectedAppts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarEmpty className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No appointments on this day</p>
              <p className="text-xs mt-1">Click Book to schedule one</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedAppts.sort((a, b) => a.time.localeCompare(b.time)).map(appt => (
                <div
                  key={appt.id}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all group"
                  style={isEmployee ? {
                    background: isMyAppt(appt) ? myColor + '15' : othersColor + '08',
                    borderColor: isMyAppt(appt) ? myColor + '40' : 'rgba(var(--border) / 1)',
                  } : { background: 'rgba(var(--muted) / 0.4)', borderColor: 'rgba(var(--border) / 1)' }}
                >
                  <div className="text-center w-12 flex-shrink-0">
                    <p
                      className="text-sm font-bold"
                      style={{ fontFamily: 'JetBrains Mono, monospace', color: isEmployee ? (isMyAppt(appt) ? myColor : othersColor) : 'var(--primary)' }}
                    >{appt.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">{appt.customerName}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[appt.status]}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{appt.serviceName} · {appt.stylistName}</p>
                    {appt.notes && <p className="text-xs text-muted-foreground/70 mt-1 italic truncate">"{appt.notes}"</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">${appt.price}</p>
                    {(isAdmin || isMyAppt(appt)) && (
                      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(appt)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
                          <EditIcon className="w-3 h-3" />
                        </button>
                        {isAdmin ? (
                          <button onClick={() => onDelete(appt.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        ) : (
                          <button onClick={() => { const cancelled = {...appt, status: 'cancelled' as AppointmentStatus}; onUpdate(cancelled); }} className="p-1 rounded text-muted-foreground hover:text-amber-400 transition-colors" title="Cancel">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All upcoming */}
      <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">All Upcoming Appointments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { label: 'Customer', col: 'customer' },
                  { label: 'Service', col: 'service' },
                  { label: 'Stylist', col: 'stylist' },
                  { label: 'Date & Time', col: 'date' },
                  { label: 'Price', col: 'price' },
                  { label: 'Status', col: 'status' },
                  { label: '', col: null },
                ].map(({ label, col }) => (
                  <th key={label} onClick={() => col && toggleSort(col as typeof sortCol)}
                    className={`text-left text-xs font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap ${col ? 'cursor-pointer hover:text-foreground select-none' : ''}`}>
                    {label}{col ? sortIcon(col as typeof sortCol) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments
                .filter(a => a.date >= today.toISOString().split('T')[0] || a.status === 'confirmed')
                .sort((a, b) => {
                  const dir = sortDir === 'asc' ? 1 : -1;
                  if (sortCol === 'date') return (a.date + a.time).localeCompare(b.date + b.time) * dir;
                  if (sortCol === 'customer') return a.customerName.localeCompare(b.customerName) * dir;
                  if (sortCol === 'stylist') return a.stylistName.localeCompare(b.stylistName) * dir;
                  if (sortCol === 'service') return a.serviceName.localeCompare(b.serviceName) * dir;
                  if (sortCol === 'price') return (a.price - b.price) * dir;
                  if (sortCol === 'status') return a.status.localeCompare(b.status) * dir;
                  return 0;
                })
                .slice(0, 20)
                .map(appt => (
                  <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {appt.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground">{appt.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{appt.serviceName}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{appt.stylistName}</td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                      {appt.date} {appt.time}
                    </td>
                    <td className="py-3 pr-4 font-medium text-foreground">${appt.price}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${STATUS_STYLES[appt.status]}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {(isAdmin || appt.stylistId === currentUser.stylistId) && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(appt)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin ? (
                            <button onClick={() => onDelete(appt.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => onUpdate({...appt, status: 'cancelled' as AppointmentStatus})} className="p-1 rounded text-muted-foreground hover:text-amber-400 transition-colors" title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editingAppt ? 'Edit Appointment' : 'Book Appointment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Customer</label>
                <ThemedSelect
                  value={form.customerId}
                  onChange={v => setForm(f => ({ ...f, customerId: v }))}
                  placeholder="Select customer"
                  options={customers.map(c => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stylist</label>
                {currentUser.role === 'employee' && currentUser.stylistId ? (
                  <div className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    {stylists.find(s => s.id === currentUser.stylistId)?.name ?? 'You'} — <span className="text-muted-foreground">{stylists.find(s => s.id === currentUser.stylistId)?.specialty}</span>
                    <span className="ml-auto text-xs text-muted-foreground">(your appointments only)</span>
                  </div>
                ) : (
                  <ThemedSelect
                    value={form.stylistId}
                    onChange={v => setForm(f => ({ ...f, stylistId: v }))}
                    placeholder="Select stylist"
                    options={stylists.map(s => ({ value: s.id, label: `${s.name} — ${s.specialty}` }))}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Service</label>
                <ThemedSelect
                  value={form.serviceId}
                  onChange={v => setForm(f => ({ ...f, serviceId: v }))}
                  placeholder="Select service"
                  options={services.map(s => ({ value: s.id, label: `${s.name} — $${s.price} (${s.duration}min)` }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Time</label>
                  <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <ThemedSelect
                  value={form.status}
                  onChange={v => setForm(f => ({ ...f, status: v as AppointmentStatus }))}
                  options={[
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special instructions…" className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">{editingAppt ? 'Save' : 'Book'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarEmpty({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>;
}

function EditIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>;
}