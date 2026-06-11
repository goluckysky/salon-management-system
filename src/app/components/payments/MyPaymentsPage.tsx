import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { CreditCard, Banknote, Globe, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { Payment, PaymentMethod, PaymentStatus, Appointment, User } from '../shared/types';

interface MyPaymentsPageProps {
  payments: Payment[];
  appointments: Appointment[];
  currentUser: User;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onPaymentCreated?: () => void;
}

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  card:   <CreditCard className="w-3.5 h-3.5" />,
  cash:   <Banknote className="w-3.5 h-3.5" />,
  online: <Globe className="w-3.5 h-3.5" />,
};

const STATUS_STYLES = {
  paid:     'bg-green-500/10 text-green-400 border-green-500/20',
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  refunded: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function MyPaymentsPage({ payments, appointments, currentUser, onUpdateStatus, onPaymentCreated }: MyPaymentsPageProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<'customer' | 'service' | 'date' | 'amount' | 'payment' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col: typeof sortCol) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  // All appointments for this stylist, sorted newest first
  const myAppointments = appointments.filter(a => a.stylistId === currentUser.stylistId);

  const paymentByAppt = new Map(payments.map(p => [p.appointmentId, p]));

  const sortedRows = [...myAppointments].sort((a, b) => {
    const pa = paymentByAppt.get(a.id);
    const pb = paymentByAppt.get(b.id);
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortCol === 'customer') return a.customerName.localeCompare(b.customerName) * dir;
    if (sortCol === 'service') return a.serviceName.localeCompare(b.serviceName) * dir;
    if (sortCol === 'date') return (b.date + b.time).localeCompare(a.date + a.time) * (sortDir === 'asc' ? -1 : 1);
    if (sortCol === 'amount') return (a.price - b.price) * dir;
    if (sortCol === 'payment') return ((pa?.status ?? 'pending').localeCompare(pb?.status ?? 'pending')) * dir;
    if (sortCol === 'status') return a.status.localeCompare(b.status) * dir;
    return (b.date + b.time).localeCompare(a.date + a.time);
  });

  const rows = myAppointments.map(appt => ({
    appt,
    payment: paymentByAppt.get(appt.id) ?? null,
  }));

  const totalEarned  = rows.filter(r => r.payment?.status === 'paid').reduce((s, r) => s + (r.payment?.amount ?? 0), 0);
  const totalPending = rows.filter(r => !r.payment || r.payment.status === 'pending').reduce((s, r) => s + r.appt.price, 0);

  const confirmingRow = confirmId
    ? confirmId.startsWith('appt_')
      ? rows.find(r => r.appt.id === confirmId.replace('appt_', ''))
      : rows.find(r => r.payment?.id === confirmId)
    : undefined;

  const handleConfirm = async () => {
    if (!confirmId) { setConfirmId(null); return; }
    // If confirmId starts with 'appt_' it means no payment record exists yet
    if (confirmId.startsWith('appt_')) {
      const apptId = confirmId.replace('appt_', '');
      const appt = appointments.find(a => a.id === apptId);
      if (appt) {
        await supabase.from('payments').insert({
          id: `p${Date.now()}`,
          appointment_id: apptId,
          customer_name: appt.customerName,
          service_name: appt.serviceName,
          amount: appt.price,
          status: 'paid',
          method: 'card',
          date: appt.date,
        });
        if (onPaymentCreated) onPaymentCreated();
      }
    } else {
      onUpdateStatus(confirmId, 'paid');
    }
    setConfirmId(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">My Payments</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Payment status for all your appointments</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Collected</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalEarned.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{rows.filter(r => r.payment?.status === 'paid').length} paid appointments</p>
        </div>
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{rows.filter(r => !r.payment || r.payment.status === 'pending').length} unpaid appointments</p>
        </div>
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Total Appointments</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{rows.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">across all time</p>
        </div>
      </div>

      {/* Table */}
      <div className="backdrop-blur-xl bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  { label: 'Customer', col: 'customer' },
                  { label: 'Service', col: 'service' },
                  { label: 'Date', col: 'date' },
                  { label: 'Appt Status', col: 'status' },
                  { label: 'Amount', col: 'amount' },
                  { label: 'Payment', col: 'payment' },
                  { label: 'Method', col: null },
                  { label: 'Action', col: null },
                ].map(({ label, col }) => (
                  <th key={label} onClick={() => col && toggleSort(col as typeof sortCol)}
                    className={`text-left text-xs font-medium text-muted-foreground px-5 py-3.5 whitespace-nowrap ${col ? 'cursor-pointer hover:text-foreground select-none' : ''}`}>
                    {label}{col ? sortIcon(col as typeof sortCol) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedRows.map(appt => {
                const payment = paymentByAppt.get(appt.id) ?? null;
                const payStatus = payment?.status ?? 'pending';
                return (

                  <tr key={appt.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {appt.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground">{appt.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{appt.serviceName}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {appt.date} {appt.time}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${
                        appt.status === 'completed' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                        appt.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        appt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-foreground">${appt.price}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${STATUS_STYLES[payStatus]}`}>
                        {payStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {payment?.method ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                          {METHOD_ICONS[payment.method]}
                          <span className="text-xs">{payment.method}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {payStatus === 'pending' && (
                        <button
                          onClick={() => setConfirmId(payment ? payment.id : `appt_${appt.id}`)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      {payStatus === 'paid' && (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                      {payStatus === 'refunded' && (
                        <span className="text-xs text-muted-foreground italic">Refunded by admin</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No appointments yet</p>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmId && confirmingRow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmId(null)}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Confirm Payment Received</h3>
                <p className="text-xs text-muted-foreground">This cannot be undone by you — only the admin can reverse it</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border mb-5 space-y-1">
              <p className="text-sm font-medium text-foreground">{confirmingRow.appt.customerName}</p>
              <p className="text-xs text-muted-foreground">
                {confirmingRow.appt.serviceName} · <span className="font-semibold text-foreground">${confirmingRow.appt.price}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-sm font-medium transition-all">
                Yes, Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}