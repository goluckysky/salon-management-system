import { useState } from 'react';
import { Plus, X, Star, Calendar, Award, Edit2, Trash2, DollarSign, UserPlus, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Stylist, Appointment, Payment, User } from '../shared/types';
import { supabase } from '../../../lib/supabase';

interface StylistsPageProps {
  stylists: Stylist[];
  appointments: Appointment[];
  payments: Payment[];
  currentUser: User;
  onAdd: (s: Omit<Stylist, 'id'>) => void;
  onUpdate: (s: Stylist) => void;
  onDelete: (id: string) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY: Omit<Stylist, 'id'> = { name: '', specialty: '', bio: '', rating: 5.0, appointmentsCompleted: 0, availability: [] };

const SUPABASE_URL = 'https://mmhbfvswlqsyqeopjmkk.supabase.co';

export function StylistsPage({ stylists, appointments, payments, currentUser, onAdd, onUpdate, onDelete }: StylistsPageProps) {
  const isAdmin = currentUser.role === 'admin';

  // Stylist add/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Stylist | null>(null);
  const [form, setForm] = useState<Omit<Stylist, 'id'>>(EMPTY);

  // Add Employee modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [empStylistId, setEmpStylistId] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empLoading, setEmpLoading] = useState(false);
  const [empResult, setEmpResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Stylists that don't yet have an employee account (we approximate by checking
  // if admin knows — in practice the admin manages this)
  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s: Stylist) => {
    setEditing(s);
    setForm({ name: s.name, specialty: s.specialty, bio: s.bio, rating: s.rating, appointmentsCompleted: s.appointmentsCompleted, availability: [...s.availability] });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) onUpdate({ ...editing, ...form });
    else onAdd(form);
    setShowModal(false);
  };

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      availability: f.availability.includes(day)
        ? f.availability.filter(d => d !== day)
        : [...f.availability, day],
    }));
  };

  const getStylistStats = (stylistId: string) => {
    const stylistAppts = appointments.filter(a => a.stylistId === stylistId);
    const today = new Date().toISOString().split('T')[0];
    const completedApptIds = stylistAppts.filter(a => a.status === 'completed').map(a => a.id);
    const earnings = payments
      .filter(p => completedApptIds.includes(p.appointmentId) && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      today: stylistAppts.filter(a => a.date === today).length,
      upcoming: stylistAppts.filter(a => a.date >= today && a.status !== 'cancelled').length,
      earnings,
    };
  };

  const openAddEmployee = () => {
    setEmpStylistId('');
    setEmpEmail('');
    setEmpPassword('');
    setEmpResult(null);
    setShowEmployeeModal(true);
  };

  const handleCreateEmployee = async () => {
    if (!empStylistId || !empEmail.trim() || !empPassword.trim()) return;
    if (empPassword.length < 6) {
      setEmpResult({ ok: false, msg: 'Password must be at least 6 characters.' });
      return;
    }
    setEmpLoading(true);
    setEmpResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const stylist = stylists.find(s => s.id === empStylistId);
      if (!stylist) throw new Error('Stylist not found');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/server/make-server-87bffbae/create-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: stylist.name,
          email: empEmail.trim(),
          password: empPassword,
          stylistId: empStylistId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setEmpResult({ ok: false, msg: data.error ?? 'Something went wrong.' });
      } else {
        setEmpResult({ ok: true, msg: `Account created for ${stylist.name}! They can now log in with ${empEmail}.` });
        setEmpEmail('');
        setEmpPassword('');
        setEmpStylistId('');
      }
    } catch (e: any) {
      setEmpResult({ ok: false, msg: e.message ?? 'Network error.' });
    } finally {
      setEmpLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {isAdmin && (
        <div className="flex justify-end gap-2">
          <button
            onClick={openAddEmployee}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30 text-sm font-medium hover:bg-accent/25 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Employee Login
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Stylist
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
        {stylists.map(stylist => {
          const stats = getStylistStats(stylist.id);
          return (
            <div key={stylist.id} className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {stylist.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{stylist.name}</h3>
                    <p className="text-sm text-primary">{stylist.specialty}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(stylist)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(stylist.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{stylist.bio}</p>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    <span className="text-sm font-bold text-foreground">{stylist.rating}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-accent/5 border border-accent/10">
                  <p className="text-sm font-bold text-foreground">{stats.today}</p>
                  <p className="text-[10px] text-muted-foreground">Today</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-muted/60 border border-border">
                  <p className="text-sm font-bold text-foreground">{stylist.appointmentsCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-500/5 border border-green-500/15 mb-3">
                  <DollarSign className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-green-400">${stats.earnings.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">total earned (paid appts)</span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Availability</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(day => (
                    <span
                      key={day}
                      className={`text-xs px-2 py-0.5 rounded-lg font-medium transition-all ${
                        stylist.availability.includes(day)
                          ? 'bg-primary/15 text-primary border border-primary/25'
                          : 'bg-muted/40 text-muted-foreground border border-border opacity-50'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {stats.upcoming} upcoming</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {stylist.appointmentsCompleted} completed</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Stylist Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editing ? 'Edit Stylist' : 'Add Stylist'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Specialty</label>
                <input type="text" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="e.g. Color & Balayage" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Availability</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                        form.availability.includes(day) ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:border-primary/20'
                      }`}
                    >{day}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">{editing ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Login Modal */}
      {showEmployeeModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !empLoading && setShowEmployeeModal(false)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-foreground">Add Employee Login</h3>
              <button onClick={() => setShowEmployeeModal(false)} disabled={empLoading} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Create a login account for a stylist so they can access the system.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stylist</label>
                <select
                  value={empStylistId}
                  onChange={e => setEmpStylistId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                >
                  <option value="">Select stylist…</option>
                  {stylists.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.specialty}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Login Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={empEmail}
                    onChange={e => setEmpEmail(e.target.value)}
                    placeholder="stylist@luxesalon.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Temporary Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={empPassword}
                    onChange={e => setEmpPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Share this with the stylist — they can change it later.</p>
              </div>
            </div>

            {empResult && (
              <div className={`mt-4 flex items-start gap-2 p-3 rounded-xl border text-sm ${
                empResult.ok
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}>
                {empResult.ok
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                }
                <span>{empResult.msg}</span>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEmployeeModal(false)} disabled={empLoading} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all disabled:opacity-50">
                {empResult?.ok ? 'Close' : 'Cancel'}
              </button>
              {!empResult?.ok && (
                <button
                  onClick={handleCreateEmployee}
                  disabled={empLoading || !empStylistId || !empEmail || !empPassword}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {empLoading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  {empLoading ? 'Creating…' : 'Create Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
