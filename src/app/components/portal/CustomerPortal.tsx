import { useState } from 'react';
import { Sun, Moon, LogOut, Scissors, CheckCircle2, Clock, X, ChevronRight, CalendarDays, Star, StickyNote, User as UserIcon } from 'lucide-react';
import type { User, Customer, Appointment, Service, Stylist, AppointmentStatus } from '../shared/types';
import { TIME_SLOTS } from '../shared/data';

interface CustomerPortalProps {
  currentUser: User;
  customer: Customer | undefined;
  appointments: Appointment[];
  services: Service[];
  stylists: Stylist[];
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
  onBookAppointment: (a: Omit<Appointment, 'id'>) => void;
  onUpdateCustomer: (c: Customer) => void;
  onCancelAppointment: (id: string) => void;
}

type PortalView = 'home' | 'book' | 'history' | 'profile';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CustomerPortal({
  currentUser, customer, appointments, services, stylists,
  theme, onThemeToggle, onLogout, onBookAppointment, onUpdateCustomer, onCancelAppointment,
}: CustomerPortalProps) {
  const [view, setView] = useState<PortalView>('home');

  // Booking flow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [booked, setBooked] = useState(false);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileNotes, setProfileNotes] = useState(customer?.notes ?? '');

  const myAppointments = customer
    ? appointments.filter(a => a.customerId === customer.id)
    : [];

  const upcoming = myAppointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.date >= today && a.status !== 'cancelled';
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const past = myAppointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.date < today || a.status === 'completed';
  }).sort((a, b) => b.date.localeCompare(a.date));

  const today = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const numDays = daysInMonth(calYear, calMonth);
  const firstDay = firstDayOfMonth(calYear, calMonth);
  const todayStr = today.toISOString().split('T')[0];

  const fmtDate = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${calYear}-${m}-${d}`;
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime || !customer) return;
    onBookAppointment({
      customerId: customer.id,
      customerName: customer.name,
      stylistId: selectedStylist.id,
      stylistName: selectedStylist.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: selectedDate,
      time: selectedTime,
      status: 'scheduled',
      notes: bookingNotes,
      price: selectedService.price,
    });
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      setView('history');
      setStep(1);
      setSelectedService(null);
      setSelectedStylist(null);
      setSelectedDate('');
      setSelectedTime('');
      setBookingNotes('');
    }, 2000);
  };

  const renderBooking = () => {
    if (booked) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Appointment Booked!</h2>
          <p className="text-muted-foreground">You're all set. Redirecting to your appointments…</p>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                : step > s ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`flex-1 h-0.5 w-8 md:w-16 ${step > s ? 'bg-green-500/40' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="grid grid-cols-4 text-center">
          {['Service', 'Stylist', 'Date & Time', 'Confirm'].map((label, i) => (
            <p key={label} className={`text-xs ${step === i + 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label}</p>
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">Choose a Service</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2); }}
                  className={`p-4 rounded-2xl border text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${
                    selectedService?.id === service.id ? 'border-primary/50 bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground text-sm">{service.name}</p>
                    <span className="text-primary font-bold">${service.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> {service.duration} min
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Stylist */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
              <h3 className="text-base font-semibold text-foreground">Choose a Stylist</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stylists.map(stylist => (
                <button
                  key={stylist.id}
                  onClick={() => { setSelectedStylist(stylist); setStep(3); }}
                  className={`p-4 rounded-2xl border text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${
                    selectedStylist?.id === stylist.id ? 'border-primary/50 bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {stylist.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{stylist.name}</p>
                      <p className="text-xs text-primary">{stylist.specialty}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{stylist.bio}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3.5 h-3.5 fill-current" /> {stylist.rating}
                    </div>
                    <span className="text-muted-foreground">{stylist.availability.join(', ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
              <h3 className="text-base font-semibold text-foreground">Pick Date & Time</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Calendar */}
              <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm">‹</button>
                  <span className="text-sm font-semibold text-foreground">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm">›</button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(d => <div key={d} className="text-center text-[10px] text-muted-foreground py-1">{d[0]}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: numDays }, (_, i) => {
                    const day = i + 1;
                    const dateStr = fmtDate(day);
                    const isPast = dateStr < todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                    const stylistAvail = selectedStylist?.availability.includes(dayName) ?? true;
                    const disabled = isPast || !stylistAvail;
                    return (
                      <button
                        key={day}
                        disabled={disabled}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`h-8 w-full rounded-lg text-sm font-medium transition-all ${
                          isSelected ? 'bg-primary text-primary-foreground shadow-sm'
                          : disabled ? 'text-muted-foreground/30 cursor-not-allowed'
                          : 'text-foreground hover:bg-muted/60'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{selectedDate ? `Available times on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Select a date first'}</p>
                {selectedDate && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_SLOTS.map(time => {
                      const taken = appointments.some(a => a.date === selectedDate && a.time === time && a.stylistId === selectedStylist?.id && a.status !== 'cancelled');
                      return (
                        <button
                          key={time}
                          disabled={taken}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                            selectedTime === time ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : taken ? 'bg-muted/30 text-muted-foreground/40 border-border cursor-not-allowed line-through'
                            : 'border-border text-foreground hover:border-primary/30 hover:bg-primary/5'
                          }`}
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {selectedDate && selectedTime && (
              <button onClick={() => setStep(4)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                Continue to Confirm
              </button>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(3)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
              <h3 className="text-base font-semibold text-foreground">Confirm Your Appointment</h3>
            </div>
            <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stylist</span>
                <span className="font-medium text-foreground">{selectedStylist?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{selectedService?.duration} min</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-3">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">${selectedService?.price}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Any notes or special requests?</label>
              <textarea rows={2} value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="e.g. reference photo, allergies, preferences…" className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
            </div>
            <button onClick={handleConfirmBooking} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Confirm Booking
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="max-w-2xl mx-auto space-y-5">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.map(appt => (
              <div key={appt.id} className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                  <p className="text-2xl font-bold text-primary">{new Date(appt.date + 'T00:00:00').getDate()}</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{appt.serviceName}</p>
                  <p className="text-sm text-muted-foreground">with {appt.stylistName} at {appt.time}</p>
                  {appt.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">"{appt.notes}"</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">${appt.price}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[appt.status]}`}>{appt.status}</span>
                  {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                    <button
                      onClick={() => onCancelAppointment(appt.id)}
                      className="mt-1.5 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all block ml-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Past Visits</h3>
          <div className="space-y-2">
            {past.map(appt => (
              <div key={appt.id} className="backdrop-blur-xl bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <div className="text-center w-10 flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground">{new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                  <p className="text-lg font-bold text-muted-foreground">{new Date(appt.date + 'T00:00:00').getDate()}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{appt.serviceName}</p>
                  <p className="text-xs text-muted-foreground">with {appt.stylistName}</p>
                </div>
                <p className="text-sm font-semibold text-muted-foreground">${appt.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No appointments yet</p>
          <button onClick={() => setView('book')} className="mt-3 text-sm text-primary hover:underline">Book your first appointment →</button>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-md mx-auto space-y-5">
      <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>
        {customer && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
              <p className="text-2xl font-bold text-primary">{customer.totalVisits}</p>
              <p className="text-xs text-muted-foreground">Visits</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center">
              <p className="text-2xl font-bold text-accent">${customer.totalSpent}</p>
              <p className="text-xs text-muted-foreground">Spent</p>
            </div>
          </div>
        )}
        {customer && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> My Notes & Preferences
              </label>
              {!editingProfile && (
                <button onClick={() => { setEditingProfile(true); setProfileNotes(customer.notes); }} className="text-xs text-primary hover:underline">Edit</button>
              )}
            </div>
            {editingProfile ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={profileNotes}
                  onChange={e => setProfileNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingProfile(false)} className="flex-1 py-2 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-muted transition-all">Cancel</button>
                  <button onClick={() => { onUpdateCustomer({ ...customer, notes: profileNotes }); setEditingProfile(false); }} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 rounded-xl bg-muted/40 border border-border min-h-[60px]">
                {customer.notes || 'No notes added yet.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Welcome */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Welcome back, {currentUser.name.split(' ')[0]}! ✨</h2>
        <p className="text-sm text-muted-foreground">Ready for your next appointment at LuxeSalon?</p>
        <button onClick={() => { setStep(1); setView('book'); }} className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
          Book an Appointment <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Next appointment */}
      {upcoming.length > 0 && (
        <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-medium text-muted-foreground mb-3">Your Next Appointment</p>
          <div className="flex items-center gap-4">
            <div className="text-center w-14 flex-shrink-0">
              <p className="text-xs text-muted-foreground">{new Date(upcoming[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
              <p className="text-3xl font-bold text-primary">{new Date(upcoming[0].date + 'T00:00:00').getDate()}</p>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{upcoming[0].serviceName}</p>
              <p className="text-sm text-muted-foreground">with {upcoming[0].stylistName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {upcoming[0].time}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${STATUS_STYLES[upcoming[0].status]}`}>{upcoming[0].status}</span>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {customer && (
        <div className="grid grid-cols-2 gap-3">
          <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{customer.totalVisits}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Visits</p>
          </div>
          <div className="backdrop-blur-xl bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">${customer.totalSpent}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Spent</p>
          </div>
        </div>
      )}
    </div>
  );

  const navItems: { view: PortalView; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'Home', icon: <Scissors className="w-4 h-4" /> },
    { view: 'book', label: 'Book', icon: <CalendarDays className="w-4 h-4" /> },
    { view: 'history', label: 'My Visits', icon: <Clock className="w-4 h-4" /> },
    { view: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/5 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-600/5 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-card border-b border-border px-5 py-3.5 flex items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Luxe<span className="text-primary">Salon</span></span>
        </div>
        <button onClick={onThemeToggle} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border transition-all">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10 px-4 py-6 overflow-y-auto">
        {view === 'home' && renderHome()}
        {view === 'book' && renderBooking()}
        {view === 'history' && renderHistory()}
        {view === 'profile' && renderProfile()}
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 z-20 backdrop-blur-xl bg-card border-t border-border px-4 py-2">
        <div className="flex justify-around max-w-sm mx-auto">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => { if (item.view === 'book') setStep(1); setView(item.view); }}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl text-xs font-medium transition-all ${
                view === item.view ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
