import { useState } from 'react';
import { Plus, X, Clock, DollarSign, Search, Scissors, Palette, Sparkles, Leaf } from 'lucide-react';
import type { Service, ServiceCategory, User } from '../shared/types';

interface ServicesPageProps {
  services: Service[];
  currentUser: User;
  onAdd: (s: Omit<Service, 'id'>) => void;
  onUpdate: (s: Service) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_CONFIG: Record<ServiceCategory, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  hair: { label: 'Hair', icon: <Scissors className="w-4 h-4" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  color: { label: 'Color', icon: <Palette className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  treatment: { label: 'Treatment', icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  nail: { label: 'Nail', icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  skin: { label: 'Skin', icon: <Sparkles className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const EMPTY: Omit<Service, 'id'> = { name: '', category: 'hair', duration: 60, price: 0, description: '' };

export function ServicesPage({ services, currentUser, onAdd, onUpdate, onDelete }: ServicesPageProps) {
  const isAdmin = currentUser.role === 'admin';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY);

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.category === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ name: s.name, category: s.category, duration: s.duration, price: s.price, description: s.description }); setShowModal(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) onUpdate({ ...editing, ...form });
    else onAdd(form);
    setShowModal(false);
  };

  const categories: (ServiceCategory | 'all')[] = ['all', 'hair', 'color', 'treatment', 'nail', 'skin'];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-sm"
          />
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${
              filter === cat
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
            }`}
          >
            {cat === 'all' ? 'All Services' : CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(service => {
          const cat = CATEGORY_CONFIG[service.category];
          return (
            <div key={service.id} className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${cat.bg} ${cat.color}`}>
                  {cat.icon}
                  {cat.label}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(service)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(service.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-1">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{service.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} min</span>
                </div>
                <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {service.price}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No services found</p>
        </div>
      )}

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editing ? 'Edit Service' : 'New Service'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Service Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="e.g. Signature Haircut" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ServiceCategory }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm">
                  {(['hair', 'color', 'treatment', 'nail', 'skin'] as ServiceCategory[]).map(c => (
                    <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Price ($)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">{editing ? 'Save' : 'Add Service'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>;
}
