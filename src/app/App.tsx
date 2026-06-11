import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import type { User, Customer, Stylist, Service, Appointment, Payment, AppPage, AppointmentStatus, PaymentStatus } from './components/shared/types';
import { supabase } from '../lib/supabase';
import { notificationStore } from './components/shared/notifications';
import { logAudit } from './components/shared/audit';
import { AuditPage } from './components/audit/AuditPage';
import { TIME_SLOTS } from './components/shared/data';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { CustomersPage } from './components/customers/CustomersPage';
import { AppointmentsPage } from './components/appointments/AppointmentsPage';
import { ServicesPage } from './components/services/ServicesPage';
import { PaymentsPage } from './components/payments/PaymentsPage';
import { MyPaymentsPage } from './components/payments/MyPaymentsPage';
import { StylistsPage } from './components/stylists/StylistsPage';
import { CustomerPortal } from './components/portal/CustomerPortal';
import { PageSkeleton } from './components/ui/Skeleton';

// re-export TIME_SLOTS so shared/data.ts is still used
export { TIME_SLOTS };

// ─── DB row → app type mappers ────────────────────────────────────────────────

function mapStylist(r: any): Stylist {
  return {
    id: r.id, name: r.name, specialty: r.specialty, bio: r.bio ?? '',
    rating: Number(r.rating), appointmentsCompleted: r.appointments_completed ?? 0,
    availability: r.availability ?? [],
  };
}

function mapCustomer(r: any): Customer {
  return {
    id: r.id, name: r.name, email: r.email, phone: r.phone ?? '',
    notes: r.notes ?? '', preferredStylistId: r.preferred_stylist_id ?? undefined,
    createdAt: r.created_at, totalVisits: r.total_visits ?? 0, totalSpent: Number(r.total_spent ?? 0),
  };
}

function mapService(r: any): Service {
  return {
    id: r.id, name: r.name, category: r.category,
    duration: r.duration, price: Number(r.price), description: r.description ?? '',
  };
}

function mapAppointment(r: any): Appointment {
  return {
    id: r.id, customerId: r.customer_id, customerName: r.customer_name,
    stylistId: r.stylist_id, stylistName: r.stylist_name,
    serviceId: r.service_id, serviceName: r.service_name,
    date: r.date, time: r.time, status: r.status, notes: r.notes ?? '', price: Number(r.price),
  };
}

function mapPayment(r: any): Payment {
  return {
    id: r.id, appointmentId: r.appointment_id, customerName: r.customer_name,
    serviceName: r.service_name, amount: Number(r.amount),
    status: r.status, method: r.method, date: r.date,
  };
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const pageFromPath = (path: string): AppPage => {
    const p = path.replace('/', '') as AppPage;
    const valid: AppPage[] = ['dashboard','customers','appointments','services','payments','stylists','portal','audit'];
    return valid.includes(p) ? p : 'dashboard';
  };

  const currentPage = pageFromPath(location.pathname);
  const setCurrentPage = (page: AppPage) => navigate('/' + page);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // ─── Theme ───────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // ─── Auth: restore session on load ───────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        stylistId: data.stylist_id ?? undefined,
        customerId: data.customer_id ?? undefined,
      };
      setCurrentUser(user);
      // Only redirect if on login page (root), otherwise stay on current page
      if (window.location.pathname === '/' || window.location.pathname === '') {
        navigate('/' + (user.role === 'customer' ? 'portal' : 'dashboard'));
      }
    }
    setLoading(false);
  };

  // ─── Load data after login ────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    loadAllData();
  }, [currentUser]);

  const loadAllData = useCallback(async () => {
    const [stylistsRes, customersRes, servicesRes, appointmentsRes, paymentsRes] = await Promise.all([
      supabase.from('stylists').select('*').order('name'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('services').select('*').order('name'),
      supabase.from('appointments').select('*').order('date').order('time'),
      supabase.from('payments').select('*').order('date', { ascending: false }),
    ]);

    if (stylistsRes.data)    setStylists(stylistsRes.data.map(mapStylist));
    if (customersRes.data)   setCustomers(customersRes.data.map(mapCustomer));
    if (servicesRes.data)    setServices(servicesRes.data.map(mapService));
    if (appointmentsRes.data) setAppointments(appointmentsRes.data.map(mapAppointment));
    if (paymentsRes.data)    setPayments(paymentsRes.data.map(mapPayment));
    setDataLoading(false);
  }, [currentUser]);

  // ─── Auth handlers ────────────────────────────────────────
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const handleRegister = async (name: string, email: string, password: string, role: 'customer' | 'admin'): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } },
    });
    return error ? error.message : null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCustomers([]); setStylists([]); setServices([]); setAppointments([]); setPayments([]);
    navigate('/');
  };

  // ─── CRUD: Customers ─────────────────────────────────────
  const addCustomer = async (c: Omit<Customer, 'id'>) => {
    const { data, error } = await supabase.from('customers').insert({
      id: `c${Date.now()}`,
      name: c.name, email: c.email, phone: c.phone, notes: c.notes,
      preferred_stylist_id: c.preferredStylistId || null,
      created_at: c.createdAt, total_visits: c.totalVisits, total_spent: c.totalSpent,
    }).select().single();
    if (data) {
      setCustomers(prev => [...prev, mapCustomer(data)]);
      notificationStore.add({ type: 'new_customer', title: 'New Customer Added', message: `${c.name} has been added to your client list` });
      if (currentUser) logAudit(currentUser, 'customer.created', `Added customer: ${c.name}`);
    }
  };

  const updateCustomer = async (c: Customer) => {
    const { data } = await supabase.from('customers').update({
      name: c.name, email: c.email, phone: c.phone, notes: c.notes,
      preferred_stylist_id: c.preferredStylistId || null,
      total_visits: c.totalVisits, total_spent: c.totalSpent,
    }).eq('id', c.id).select().single();
    if (data) {
      setCustomers(prev => prev.map(x => x.id === c.id ? mapCustomer(data) : x));
      if (currentUser) logAudit(currentUser, 'customer.updated', `Updated customer: ${c.name}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    const target = customers.find(x => x.id === id);
    await supabase.from('customers').delete().eq('id', id);
    setCustomers(prev => prev.filter(x => x.id !== id));
    if (currentUser && target) logAudit(currentUser, 'customer.deleted', `Deleted customer: ${target.name}`);
  };

  // ─── CRUD: Stylists ──────────────────────────────────────
  const addStylist = async (s: Omit<Stylist, 'id'>) => {
    const { data } = await supabase.from('stylists').insert({
      id: `s${Date.now()}`, name: s.name, specialty: s.specialty, bio: s.bio,
      rating: s.rating, appointments_completed: s.appointmentsCompleted, availability: s.availability,
    }).select().single();
    if (data) setStylists(prev => [...prev, mapStylist(data)]);
  };

  const updateStylist = async (s: Stylist) => {
    const { data } = await supabase.from('stylists').update({
      name: s.name, specialty: s.specialty, bio: s.bio,
      rating: s.rating, appointments_completed: s.appointmentsCompleted, availability: s.availability,
    }).eq('id', s.id).select().single();
    if (data) setStylists(prev => prev.map(x => x.id === s.id ? mapStylist(data) : x));
  };

  const deleteStylist = async (id: string) => {
    await supabase.from('stylists').delete().eq('id', id);
    setStylists(prev => prev.filter(x => x.id !== id));
  };

  // ─── CRUD: Services ──────────────────────────────────────
  const addService = async (s: Omit<Service, 'id'>) => {
    const { data } = await supabase.from('services').insert({
      id: `sv${Date.now()}`, name: s.name, category: s.category,
      duration: s.duration, price: s.price, description: s.description,
    }).select().single();
    if (data) setServices(prev => [...prev, mapService(data)]);
  };

  const updateService = async (s: Service) => {
    const { data } = await supabase.from('services').update({
      name: s.name, category: s.category, duration: s.duration,
      price: s.price, description: s.description,
    }).eq('id', s.id).select().single();
    if (data) setServices(prev => prev.map(x => x.id === s.id ? mapService(data) : x));
  };

  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(x => x.id !== id));
  };

  // ─── CRUD: Appointments ──────────────────────────────────
  const addAppointment = async (a: Omit<Appointment, 'id'>) => {
    const apptId = `a${Date.now()}`;
    const { data } = await supabase.from('appointments').insert({
      id: apptId,
      customer_id: a.customerId, customer_name: a.customerName,
      stylist_id: a.stylistId, stylist_name: a.stylistName,
      service_id: a.serviceId, service_name: a.serviceName,
      date: a.date, time: a.time, status: a.status, notes: a.notes, price: a.price,
    }).select().single();

    if (data) {
      setAppointments(prev => [...prev, mapAppointment(data)]);
      notificationStore.add({ type: 'appointment', title: 'New Appointment Booked', message: `${a.customerName} — ${a.serviceName} with ${a.stylistName} on ${a.date} at ${a.time}` });
      if (currentUser) logAudit(currentUser, 'appointment.created', `Booked ${a.serviceName} for ${a.customerName} with ${a.stylistName} on ${a.date} at ${a.time}`);
      // Auto-create pending payment
      const { data: pData } = await supabase.from('payments').insert({
        id: `p${Date.now()}`,
        appointment_id: apptId,
        customer_name: a.customerName,
        service_name: a.serviceName,
        amount: a.price,
        status: 'pending',
        method: 'card',
        date: a.date,
      }).select().single();
      if (pData) setPayments(prev => [...prev, mapPayment(pData)]);
    }
  };

  const updateAppointment = async (a: Appointment) => {
    const { data } = await supabase.from('appointments').update({
      customer_id: a.customerId, customer_name: a.customerName,
      stylist_id: a.stylistId, stylist_name: a.stylistName,
      service_id: a.serviceId, service_name: a.serviceName,
      date: a.date, time: a.time, status: a.status, notes: a.notes, price: a.price,
    }).eq('id', a.id).select().single();
    if (data) {
      setAppointments(prev => prev.map(x => x.id === a.id ? mapAppointment(data) : x));
      const action = a.status === 'cancelled' ? 'appointment.cancelled' : 'appointment.updated';
      if (currentUser) logAudit(currentUser, action, `${a.status === 'cancelled' ? 'Cancelled' : 'Updated'} appointment: ${a.serviceName} for ${a.customerName} on ${a.date}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    const apptToDelete = appointments.find(x => x.id === id);
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(prev => prev.filter(x => x.id !== id));
    if (currentUser && apptToDelete) logAudit(currentUser, 'appointment.deleted', `Deleted appointment: ${apptToDelete.serviceName} for ${apptToDelete.customerName}`);
  };

  // ─── CRUD: Payments ──────────────────────────────────────
  const updatePaymentStatus = async (id: string, status: PaymentStatus) => {
    const { data } = await supabase.from('payments').update({ status }).eq('id', id).select().single();
    if (data) {
      setPayments(prev => prev.map(x => x.id === id ? mapPayment(data) : x));
      const payment = mapPayment(data);
      if (status === 'paid') {
        notificationStore.add({ type: 'payment', title: 'Payment Received', message: `$${payment.amount} from ${payment.customerName} for ${payment.serviceName}` });
        if (currentUser) logAudit(currentUser, 'payment.marked_paid', `Marked $${payment.amount} as paid — ${payment.customerName} for ${payment.serviceName}`);
      } else if (status === 'refunded') {
        notificationStore.add({ type: 'cancellation', title: 'Payment Refunded', message: `$${payment.amount} refunded to ${payment.customerName} for ${payment.serviceName}` });
        if (currentUser) logAudit(currentUser, 'payment.refunded', `Refunded $${payment.amount} to ${payment.customerName} for ${payment.serviceName}`);
      } else if (status === 'pending') {
        if (currentUser) logAudit(currentUser, 'payment.undo_refund', `Reversed refund of $${payment.amount} for ${payment.customerName}`);
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (currentUser.role === 'customer') {
    const customerRecord = customers.find(c => c.id === currentUser.customerId);
    return (
      <CustomerPortal
        currentUser={currentUser}
        customer={customerRecord}
        appointments={appointments}
        services={services}
        stylists={stylists}
        theme={theme}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
        onBookAppointment={addAppointment}
        onUpdateCustomer={updateCustomer}
        onCancelAppointment={async (id) => {
          const appt = appointments.find(a => a.id === id);
          if (appt) {
            await updateAppointment({ ...appt, status: 'cancelled' });
            notificationStore.add({
              type: 'cancellation',
              title: 'Appointment Cancelled',
              message: `${appt.customerName} cancelled ${appt.serviceName} on ${appt.date} at ${appt.time}`,
            });
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-600/8 to-purple-800/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-500/8 to-blue-700/5 blur-[100px]" />
      </div>

      <div className="hidden md:flex relative z-10 flex-shrink-0">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          currentUser={currentUser}
          stylists={stylists}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header currentPage={currentPage} theme={theme} onThemeToggle={toggleTheme} onNavigate={setCurrentPage} customers={customers} appointments={appointments} services={services} stylists={stylists} onMobileMenuOpen={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {dataLoading && currentPage === 'dashboard' && <PageSkeleton type="dashboard" />}
          {dataLoading && currentPage === 'customers' && <PageSkeleton type="cards" />}
          {dataLoading && currentPage === 'appointments' && <PageSkeleton type="table" />}
          {dataLoading && currentPage === 'services' && <PageSkeleton type="cards" />}
          {dataLoading && currentPage === 'payments' && <PageSkeleton type="table" />}
          {dataLoading && currentPage === 'stylists' && <PageSkeleton type="cards" />}
          {!dataLoading && currentPage === 'dashboard' && (
            <Dashboard appointments={appointments} customers={customers} payments={payments} stylists={stylists} currentUser={currentUser} theme={theme} />
          )}
          {!dataLoading && currentPage === 'customers' && (
            <CustomersPage customers={customers} stylists={stylists} currentUser={currentUser} onAdd={addCustomer} onUpdate={updateCustomer} onDelete={deleteCustomer} />
          )}
          {!dataLoading && currentPage === 'appointments' && (
            <AppointmentsPage appointments={appointments} customers={customers} stylists={stylists} services={services} currentUser={currentUser} onAdd={addAppointment} onUpdate={updateAppointment} onDelete={deleteAppointment} />
          )}
          {!dataLoading && currentPage === 'services' && (
            <ServicesPage services={services} currentUser={currentUser} onAdd={addService} onUpdate={updateService} onDelete={deleteService} />
          )}
          {!dataLoading && currentPage === 'payments' && currentUser.role === 'admin' && (
            <PaymentsPage payments={payments} appointments={appointments} onUpdateStatus={updatePaymentStatus} />
          )}
          {!dataLoading && currentPage === 'payments' && currentUser.role === 'employee' && (
            <MyPaymentsPage
              payments={payments}
              appointments={appointments}
              currentUser={currentUser}
              onUpdateStatus={updatePaymentStatus}
              onPaymentCreated={loadAllData}
            />
          )}
          {!dataLoading && currentPage === 'audit' && (
            <AuditPage />
          )}
          {!dataLoading && currentPage === 'stylists' && (
            <StylistsPage stylists={stylists} appointments={appointments} payments={payments} currentUser={currentUser} onAdd={addStylist} onUpdate={updateStylist} onDelete={deleteStylist} />
          )}
        </main>
      </div>
    </div>
  );
}