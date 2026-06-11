import type { User, Customer, Stylist, Service, Appointment, Payment } from './types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const USERS: User[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'admin@luxesalon.com', role: 'admin' },
  { id: 'u2', name: 'Marcus Rivera', email: 'employee@luxesalon.com', role: 'employee' },
  { id: 'u3', name: 'Emma Williams', email: 'emma@example.com', role: 'customer', customerId: 'c1' },
  { id: 'u4', name: 'Olivia Hart', email: 'olivia@example.com', role: 'customer', customerId: 'c2' },
];

export const PASSWORDS: Record<string, string> = {
  'admin@luxesalon.com': 'admin123',
  'employee@luxesalon.com': 'emp123',
  'emma@example.com': 'emma123',
  'olivia@example.com': 'olivia123',
};

export const CUSTOMERS: Customer[] = [
  {
    id: 'c1', name: 'Emma Williams', email: 'emma@example.com', phone: '+1 (555) 234-5678',
    notes: 'Prefers Olaplex treatments, allergic to ammonia-based dye. Loves warm honey tones.',
    preferredStylistId: 's1', createdAt: '2024-01-15', totalVisits: 12, totalSpent: 1840,
  },
  {
    id: 'c2', name: 'Olivia Hart', email: 'olivia@example.com', phone: '+1 (555) 345-6789',
    notes: 'Loves balayage, comes every 8 weeks. Prefers cool ash tones.',
    preferredStylistId: 's2', createdAt: '2024-02-20', totalVisits: 8, totalSpent: 1240,
  },
  {
    id: 'c3', name: 'Sophia Lee', email: 'sophia@example.com', phone: '+1 (555) 456-7890',
    notes: 'New client, interested in keratin treatment. Fine, straight hair.',
    createdAt: '2024-03-10', totalVisits: 3, totalSpent: 420,
  },
  {
    id: 'c4', name: 'Isabella Brown', email: 'isabella@example.com', phone: '+1 (555) 567-8901',
    notes: 'Regular blowout client, prefers light hold products. Very thick hair.',
    preferredStylistId: 's1', createdAt: '2023-11-05', totalVisits: 24, totalSpent: 2160,
  },
  {
    id: 'c5', name: 'Ava Martinez', email: 'ava@example.com', phone: '+1 (555) 678-9012',
    notes: 'Getting married in June, booking bridal package. Wants romantic updo.',
    preferredStylistId: 's3', createdAt: '2024-04-01', totalVisits: 5, totalSpent: 780,
  },
  {
    id: 'c6', name: 'Charlotte Davis', email: 'charlotte@example.com', phone: '+1 (555) 789-0123',
    notes: 'Scalp sensitivity — always use gentle, sulphate-free formulas.',
    createdAt: '2024-01-28', totalVisits: 7, totalSpent: 910,
  },
  {
    id: 'c7', name: 'Mia Johnson', email: 'mia@example.com', phone: '+1 (555) 890-1234',
    notes: 'Natural hair texture, only book with River for extension work.',
    preferredStylistId: 's4', createdAt: '2024-05-03', totalVisits: 4, totalSpent: 660,
  },
];

export const STYLISTS: Stylist[] = [
  {
    id: 's1', name: 'Jade Monroe', specialty: 'Color & Balayage',
    bio: '10 years specializing in lived-in color and dimensional highlights. Certified in Olaplex and Redken.',
    rating: 4.9, appointmentsCompleted: 847,
    availability: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
  },
  {
    id: 's2', name: 'Kai Nakamura', specialty: 'Cuts & Precision Styling',
    bio: 'Master stylist trained in Tokyo and NYC. Specializes in razor cuts, textured bobs, and editorial styling.',
    rating: 4.8, appointmentsCompleted: 612,
    availability: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  {
    id: 's3', name: 'Luna Vasquez', specialty: 'Treatments & Bridal',
    bio: 'Certified trichologist and bridal hair specialist. Expert in scalp health and intricate updos.',
    rating: 4.9, appointmentsCompleted: 503,
    availability: ['Mon', 'Wed', 'Fri', 'Sat'],
  },
  {
    id: 's4', name: 'River Chen', specialty: 'Extensions & Texture',
    bio: 'Keratin treatment expert and extension-certified artist. Works wonders on natural curls and coils.',
    rating: 4.7, appointmentsCompleted: 389,
    availability: ['Mon', 'Tue', 'Wed', 'Thu'],
  },
];

export const SERVICES: Service[] = [
  { id: 'sv1', name: 'Signature Haircut', category: 'hair', duration: 60, price: 95, description: 'Precision cut with consultation, wash, and blow-dry style.' },
  { id: 'sv2', name: 'Full Balayage', category: 'color', duration: 180, price: 280, description: 'Hand-painted balayage with toning gloss for a seamless, sun-kissed result.' },
  { id: 'sv3', name: 'Root Touch-Up', category: 'color', duration: 90, price: 120, description: 'Single-process color application at roots with tone-matching gloss.' },
  { id: 'sv4', name: 'Keratin Treatment', category: 'treatment', duration: 150, price: 320, description: 'Smoothing keratin treatment — frizz-free results lasting 3–6 months.' },
  { id: 'sv5', name: 'Olaplex Treatment', category: 'treatment', duration: 45, price: 75, description: 'Bond-building treatment to repair and strengthen chemically processed hair.' },
  { id: 'sv6', name: 'Blowout & Style', category: 'hair', duration: 45, price: 65, description: 'Professional blowout with styling of choice — straight, waves, or volume.' },
  { id: 'sv7', name: 'Highlights', category: 'color', duration: 120, price: 185, description: 'Foil highlights for dimension, brightness, and natural-looking depth.' },
  { id: 'sv8', name: 'Bridal Updo', category: 'hair', duration: 90, price: 175, description: 'Elegant bridal styling with a complimentary trial consultation included.' },
  { id: 'sv9', name: 'Scalp Treatment', category: 'treatment', duration: 60, price: 90, description: 'Therapeutic scalp massage with nourishing serum for scalp health.' },
  { id: 'sv10', name: 'Gloss & Toner', category: 'color', duration: 60, price: 80, description: 'Color gloss or toning treatment for enhanced vibrancy and shine.' },
];

export const APPOINTMENTS: Appointment[] = [
  { id: 'a1', customerId: 'c1', customerName: 'Emma Williams', stylistId: 's1', stylistName: 'Jade Monroe', serviceId: 'sv2', serviceName: 'Full Balayage', date: fmt(today), time: '10:00', status: 'confirmed', notes: 'Wants warm honey tones, reference photo sent.', price: 280 },
  { id: 'a2', customerId: 'c2', customerName: 'Olivia Hart', stylistId: 's2', stylistName: 'Kai Nakamura', serviceId: 'sv1', serviceName: 'Signature Haircut', date: fmt(today), time: '11:30', status: 'scheduled', notes: '', price: 95 },
  { id: 'a3', customerId: 'c4', customerName: 'Isabella Brown', stylistId: 's1', stylistName: 'Jade Monroe', serviceId: 'sv6', serviceName: 'Blowout & Style', date: fmt(today), time: '14:00', status: 'confirmed', notes: 'Prefers maximum volume.', price: 65 },
  { id: 'a4', customerId: 'c3', customerName: 'Sophia Lee', stylistId: 's4', stylistName: 'River Chen', serviceId: 'sv4', serviceName: 'Keratin Treatment', date: fmt(addDays(today, 1)), time: '10:00', status: 'scheduled', notes: 'First keratin — needs full consultation beforehand.', price: 320 },
  { id: 'a5', customerId: 'c5', customerName: 'Ava Martinez', stylistId: 's3', stylistName: 'Luna Vasquez', serviceId: 'sv8', serviceName: 'Bridal Updo', date: fmt(addDays(today, 2)), time: '14:00', status: 'scheduled', notes: 'Trial run for June 15 wedding.', price: 175 },
  { id: 'a6', customerId: 'c6', customerName: 'Charlotte Davis', stylistId: 's3', stylistName: 'Luna Vasquez', serviceId: 'sv9', serviceName: 'Scalp Treatment', date: fmt(addDays(today, -1)), time: '11:00', status: 'completed', notes: 'Sensitive scalp — used gentle formula.', price: 90 },
  { id: 'a7', customerId: 'c1', customerName: 'Emma Williams', stylistId: 's1', stylistName: 'Jade Monroe', serviceId: 'sv5', serviceName: 'Olaplex Treatment', date: fmt(addDays(today, -3)), time: '15:00', status: 'completed', notes: '', price: 75 },
  { id: 'a8', customerId: 'c2', customerName: 'Olivia Hart', stylistId: 's2', stylistName: 'Kai Nakamura', serviceId: 'sv7', serviceName: 'Highlights', date: fmt(addDays(today, -5)), time: '10:30', status: 'completed', notes: 'Cool ash dimensional highlights.', price: 185 },
  { id: 'a9', customerId: 'c4', customerName: 'Isabella Brown', stylistId: 's1', stylistName: 'Jade Monroe', serviceId: 'sv3', serviceName: 'Root Touch-Up', date: fmt(addDays(today, 3)), time: '12:00', status: 'scheduled', notes: '', price: 120 },
  { id: 'a10', customerId: 'c5', customerName: 'Ava Martinez', stylistId: 's3', stylistName: 'Luna Vasquez', serviceId: 'sv10', serviceName: 'Gloss & Toner', date: fmt(addDays(today, -2)), time: '14:30', status: 'completed', notes: '', price: 80 },
  { id: 'a11', customerId: 'c7', customerName: 'Mia Johnson', stylistId: 's4', stylistName: 'River Chen', serviceId: 'sv4', serviceName: 'Keratin Treatment', date: fmt(addDays(today, -7)), time: '09:00', status: 'completed', notes: '', price: 320 },
  { id: 'a12', customerId: 'c3', customerName: 'Sophia Lee', stylistId: 's2', stylistName: 'Kai Nakamura', serviceId: 'sv1', serviceName: 'Signature Haircut', date: fmt(addDays(today, -4)), time: '13:00', status: 'completed', notes: '', price: 95 },
];

export const PAYMENTS: Payment[] = [
  { id: 'p1', appointmentId: 'a6', customerName: 'Charlotte Davis', serviceName: 'Scalp Treatment', amount: 90, status: 'paid', method: 'card', date: fmt(addDays(today, -1)) },
  { id: 'p2', appointmentId: 'a7', customerName: 'Emma Williams', serviceName: 'Olaplex Treatment', amount: 75, status: 'paid', method: 'card', date: fmt(addDays(today, -3)) },
  { id: 'p3', appointmentId: 'a8', customerName: 'Olivia Hart', serviceName: 'Highlights', amount: 185, status: 'paid', method: 'online', date: fmt(addDays(today, -5)) },
  { id: 'p4', appointmentId: 'a10', customerName: 'Ava Martinez', serviceName: 'Gloss & Toner', amount: 80, status: 'paid', method: 'cash', date: fmt(addDays(today, -2)) },
  { id: 'p5', appointmentId: 'a11', customerName: 'Mia Johnson', serviceName: 'Keratin Treatment', amount: 320, status: 'paid', method: 'card', date: fmt(addDays(today, -7)) },
  { id: 'p6', appointmentId: 'a12', customerName: 'Sophia Lee', serviceName: 'Signature Haircut', amount: 95, status: 'paid', method: 'cash', date: fmt(addDays(today, -4)) },
  { id: 'p7', appointmentId: 'a1', customerName: 'Emma Williams', serviceName: 'Full Balayage', amount: 280, status: 'pending', method: 'card', date: fmt(today) },
  { id: 'p8', appointmentId: 'a2', customerName: 'Olivia Hart', serviceName: 'Signature Haircut', amount: 95, status: 'pending', method: 'card', date: fmt(today) },
  { id: 'p9', appointmentId: 'a3', customerName: 'Isabella Brown', serviceName: 'Blowout & Style', amount: 65, status: 'pending', method: 'cash', date: fmt(today) },
];

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];
