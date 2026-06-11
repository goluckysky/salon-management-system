import { useState } from 'react';
import { DollarSign, CreditCard, Banknote, Globe, TrendingUp, X, RotateCcw, AlertCircle } from 'lucide-react';
import type { Payment, PaymentStatus, PaymentMethod, Appointment } from '../shared/types';

interface PaymentsPageProps {
  payments: Payment[];
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  refunded: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  card: <CreditCard className="w-3.5 h-3.5" />,
  cash: <Banknote className="w-3.5 h-3.5" />,
  online: <Globe className="w-3.5 h-3.5" />,
};

export function PaymentsPage({ payments, appointments, onUpdateStatus }: PaymentsPageProps) {
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
  const getAppt = (appointmentId: string) => appointments.find(a => a.id === appointmentId);
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [sortCol, setSortCol] = useState<'customer' | 'service' | 'stylist' | 'amount' | 'date' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col: typeof sortCol) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
  // confirmId = payment being confirmed; confirmAction = what action is pending
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<PaymentStatus | null>(null);

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  const filters: (PaymentStatus | 'all')[] = ['all', 'paid', 'pending', 'refunded'];

  const requestAction = (id: string, action: PaymentStatus) => {
    setConfirmId(id);
    setConfirmAction(action);
  };

  const confirmChange = () => {
    if (confirmId && confirmAction) {
      onUpdateStatus(confirmId, confirmAction);
    }
    setConfirmId(null);
    setConfirmAction(null);
  };

  const cancelConfirm = () => {
    setConfirmId(null);
    setConfirmAction(null);
  };

  const confirmingPayment = payments.find(p => p.id === confirmId);

  return (
    <div className="p-6 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Collected</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{payments.filter(p => p.status === 'paid').length} transactions</p>
        </div>
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{payments.filter(p => p.status === 'pending').length} awaiting payment</p>
        </div>
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
              <X className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Refunded</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalRefunded.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{payments.filter(p => p.status === 'refunded').length} refunds</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${
              filter === f
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Transactions' : f}
          </button>
        ))}
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
                  { label: 'Stylist', col: 'stylist' },
                  { label: 'Amount', col: 'amount' },
                  { label: 'Method', col: null },
                  { label: 'Date', col: 'date' },
                  { label: 'Status', col: 'status' },
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
              {[...filtered].sort((a, b) => {
                const dir = sortDir === 'asc' ? 1 : -1;
                if (sortCol === 'customer') return a.customerName.localeCompare(b.customerName) * dir;
                if (sortCol === 'service') return a.serviceName.localeCompare(b.serviceName) * dir;
                if (sortCol === 'amount') return (a.amount - b.amount) * dir;
                if (sortCol === 'date') return a.date.localeCompare(b.date) * dir;
                if (sortCol === 'status') return a.status.localeCompare(b.status) * dir;
                if (sortCol === 'stylist') {
                  const aAppt = getAppt(a.appointmentId);
                  const bAppt = getAppt(b.appointmentId);
                  return ((aAppt?.stylistName ?? '').localeCompare(bAppt?.stylistName ?? '')) * dir;
                }
                return b.date.localeCompare(a.date);
              }).map(payment => (
                <tr key={payment.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 cursor-pointer" onClick={() => setDetailPayment(payment)}>
                    <div className="flex items-center gap-2 group">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {payment.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{payment.customerName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setDetailPayment(payment)}>
                    {payment.serviceName}
                  </td>
                  <td className="px-5 py-4">
                    {(() => { const appt = getAppt(payment.appointmentId); return appt ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                          {appt.stylistName.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{appt.stylistName}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>; })()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-foreground text-base">${payment.amount}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                      {METHOD_ICONS[payment.method]}
                      <span className="text-xs">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {payment.date}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${STATUS_STYLES[payment.status]}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => requestAction(payment.id, 'paid')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      {payment.status === 'paid' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => requestAction(payment.id, 'pending')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-medium flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Undo
                          </button>
                          <button
                            onClick={() => requestAction(payment.id, 'refunded')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-medium"
                          >
                            Refund
                          </button>
                        </div>
                      )}
                      {payment.status === 'refunded' && (
                        <button
                          onClick={() => requestAction(payment.id, 'paid')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-medium flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Undo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions found</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailPayment && (() => {
        const appt = getAppt(detailPayment.appointmentId);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailPayment(null)}>
            <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">Payment Details</h3>
                <button onClick={() => setDetailPayment(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-bold text-primary">
                    {detailPayment.customerName.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{detailPayment.customerName}</p>
                    <p className="text-xs text-muted-foreground">Customer</p>
                  </div>
                </div>
                {appt && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center text-sm font-bold text-accent">
                      {appt.stylistName.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{appt.stylistName}</p>
                      <p className="text-xs text-muted-foreground">Stylist</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Service</p>
                    <p className="text-sm font-medium text-foreground">{detailPayment.serviceName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="text-sm font-bold text-foreground">\${detailPayment.amount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-sm font-medium text-foreground">{detailPayment.date}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Method</p>
                    <p className="text-sm font-medium text-foreground capitalize">{detailPayment.method}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${STATUS_STYLES[detailPayment.status]}`}>
                    {detailPayment.status}
                  </span>
                </div>
                {appt && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Appointment</p>
                    <p className="text-xs text-foreground">{appt.date} at {appt.time}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation modal */}
      {confirmId && confirmingPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={cancelConfirm}>
          <div className="bg-popover border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                confirmAction === 'refunded' ? 'bg-red-500/15' : 'bg-amber-500/15'
              }`}>
                <AlertCircle className={`w-5 h-5 ${confirmAction === 'refunded' ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {confirmAction === 'refunded' ? 'Confirm Refund' : confirmAction === 'pending' ? 'Undo Payment?' : confirmingPayment?.status === 'refunded' ? 'Undo Refund?' : 'Confirm Payment'}
                </h3>
                <p className="text-xs text-muted-foreground">This will update the payment record</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border mb-5 space-y-1">
              <p className="text-sm font-medium text-foreground">{confirmingPayment.customerName}</p>
              <p className="text-xs text-muted-foreground">{confirmingPayment.serviceName} · <span className="font-semibold text-foreground">${confirmingPayment.amount}</span></p>
              <p className="text-xs text-muted-foreground">
                Status: <span className={`font-medium capitalize ${STATUS_STYLES[confirmingPayment.status].split(' ')[1]}`}>{confirmingPayment.status}</span>
                {' → '}
                <span className={`font-medium capitalize ${confirmAction ? STATUS_STYLES[confirmAction].split(' ')[1] : ''}`}>{confirmAction}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelConfirm} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all">
                Cancel
              </button>
              <button
                onClick={confirmChange}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  confirmAction === 'refunded'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {confirmAction === 'refunded' ? 'Yes, Refund' : confirmAction === 'pending' ? 'Yes, Undo Payment' : confirmingPayment?.status === 'refunded' ? 'Yes, Undo Refund' : 'Yes, Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}