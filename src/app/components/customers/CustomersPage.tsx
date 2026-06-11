import { useState } from 'react';
import { Search, Plus, X, Phone, Mail, Star, Edit2, Trash2, StickyNote } from 'lucide-react';
import { ThemedSelect } from '../ui/ThemedSelect';
import type { Customer, Stylist, User } from '../shared/types';

interface CustomersPageProps {
  customers: Customer[];
  stylists: Stylist[];
  currentUser: User;
  onAdd: (c: Omit<Customer, 'id'>) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
}

const EMPTY: Omit<Customer, 'id'> = {
  name: '', email: '', phone: '', notes: '',
  preferredStylistId: '', createdAt: new Date().toISOString().split('T')[0],
  totalVisits: 0, totalSpent: 0,
};

export function CustomersPage({ customers, stylists, currentUser, onAdd, onUpdate, onDelete }: CustomersPageProps) {
  const isAdmin = currentUser.role === 'admin';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, 'id'>>(EMPTY);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, createdAt: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, notes: c.notes, preferredStylistId: c.preferredStylistId, createdAt: c.createdAt, totalVisits: c.totalVisits, totalSpent: c.totalSpent });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) onUpdate({ ...editing, ...form });
    else onAdd(form);
    setShowModal(false);
  };

  const preferredName = (id?: string) => stylists.find(s => s.id === id)?.name ?? '—';

  return (
    <div className="p-6 space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-sm"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(customer => (
          <div
            key={customer.id}
            onClick={() => setDetailCustomer(customer)}
            className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">Since {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); openEdit(customer); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(customer.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
              {customer.preferredStylistId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Star className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Prefers {preferredName(customer.preferredStylistId)}</span>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 mb-3">
                <StickyNote className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground line-clamp-2">{customer.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{customer.totalVisits}</p>
                <p className="text-[10px] text-muted-foreground">Visits</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">${customer.totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Spent</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No customers found</p>
          <p className="text-sm">Try a different search or add a new client</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editing ? 'Edit Customer' : 'New Customer'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {(['name', 'email', 'phone'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 capitalize">{field}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Stylist</label>
                <ThemedSelect
                  value={form.preferredStylistId ?? ''}
                  onChange={v => setForm(f => ({ ...f, preferredStylistId: v || undefined }))}
                  placeholder="No preference"
                  options={[{ value: '', label: 'No preference' }, ...stylists.map(s => ({ value: s.id, label: s.name }))]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes & Preferences</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Allergies, preferences, special instructions…"
                  className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
                {editing ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailCustomer(null)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Customer Profile</h3>
              <button onClick={() => setDetailCustomer(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                {detailCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{detailCustomer.name}</p>
                <p className="text-sm text-muted-foreground">Client since {new Date(detailCustomer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <p className="text-xl font-bold text-primary">{detailCustomer.totalVisits}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center">
                <p className="text-xl font-bold text-accent">${detailCustomer.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {detailCustomer.email}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /> {detailCustomer.phone}</div>
              {detailCustomer.preferredStylistId && (
                <div className="flex items-center gap-2 text-muted-foreground"><Star className="w-4 h-4" /> Prefers {preferredName(detailCustomer.preferredStylistId)}</div>
              )}
            </div>
            {detailCustomer.notes && (
              <div className="mt-4 p-3 rounded-xl bg-muted/60 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes & Preferences</p>
                <p className="text-sm text-foreground">{detailCustomer.notes}</p>
              </div>
            )}
            <button
              onClick={() => { setDetailCustomer(null); openEdit(detailCustomer); }}
              className="w-full mt-4 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Users2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
