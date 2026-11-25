import {
  Bell, Boxes, Building2, CalendarCheck, ClipboardList,
  LayoutDashboard, Pill, Sparkles, Store, User, Users,
} from 'lucide-react';

export const APP_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/summary', label: 'AI Summary', icon: Sparkles },
  { to: '/adherence', label: 'Adherence', icon: CalendarCheck },
  { to: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
  { to: '/medicines', label: 'Medicines', icon: Pill },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/family', label: 'Family', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/organisations', label: 'Organisations', icon: Building2 },
  { to: '/vendors', label: 'Pharmacies', icon: Store },
  { to: '/profile', label: 'Profile', icon: User },
];
