export type Role = 'admin' | 'employee' | 'customer';

export type AppPage =
  | 'dashboard'
  | 'customers'
  | 'appointments'
  | 'services'
  | 'payments'
  | 'stylists'
  | 'portal'
  | 'audit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  stylistId?: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  preferredStylistId?: string;
  createdAt: string;
  totalVisits: number;
  totalSpent: number;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  appointmentsCompleted: number;
  availability: string[];
}

export type ServiceCategory = 'hair' | 'color' | 'treatment' | 'nail' | 'skin';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  description: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  stylistId: string;
  stylistName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  price: number;
}

export type PaymentStatus = 'paid' | 'pending' | 'refunded';
export type PaymentMethod = 'card' | 'cash' | 'online';

export interface Payment {
  id: string;
  appointmentId: string;
  customerName: string;
  serviceName: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string;
}

export type AuditAction =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.deleted'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'payment.marked_paid'
  | 'payment.refunded'
  | 'payment.undo_refund'
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'stylist.created'
  | 'stylist.updated'
  | 'stylist.deleted'
  | 'employee.created'
  | 'auth.login'
  | 'auth.logout';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor_id: string;
  actor_name: string;
  actor_role: Role;
  target: string;       // human-readable description of what was affected
  metadata?: Record<string, any>;
  created_at: string;
}
