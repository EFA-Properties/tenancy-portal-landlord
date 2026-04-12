/// <reference types="vite/client" />

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  type Icon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>
  export const Home: Icon
  export const Building2: Icon
  export const FileText: Icon
  export const Users: Icon
  export const ClipboardList: Icon
  export const Shield: Icon
  export const Wrench: Icon
  export const Settings: Icon
  export const Bell: Icon
  export const ChevronRight: Icon
  export const ChevronLeft: Icon
  export const ChevronDown: Icon
  export const Plus: Icon
  export const Search: Icon
  export const Filter: Icon
  export const X: Icon
  export const AlertTriangle: Icon
  export const AlertCircle: Icon
  export const CheckCircle: Icon
  export const Clock: Icon
  export const Upload: Icon
  export const Download: Icon
  export const Eye: Icon
  export const Edit: Icon
  export const Trash2: Icon
  export const Mail: Icon
  export const Phone: Icon
  export const MapPin: Icon
  export const Calendar: Icon
  export const DollarSign: Icon
  export const FileCheck: Icon
  export const ShieldAlert: Icon
  export const Inbox: Icon
  export const ArrowLeft: Icon
  export const MoreVertical: Icon
  export const RefreshCw: Icon
  export const Send: Icon
  export const LogOut: Icon
  export const Menu: Icon
  export const Cog: Icon
  export const Key: Icon
  export const Building: Icon
  export const UserPlus: Icon
  export const ExternalLink: Icon
  export const Info: Icon
  export const XCircle: Icon
  export const BarChart3: Icon
  export const TrendingUp: Icon
  export const Activity: Icon
  export const CheckSquare: Icon
  export const CheckCircle2: Icon
  export type LucideIcon = Icon
}

declare module 'date-fns/format' {
  export default function format(date: Date | number | string, formatStr: string): string
}

declare module 'date-fns' {
  export function format(date: Date | number | string, formatStr: string): string
  export function formatDistanceToNow(date: Date | number | string, options?: any): string
  export function parseISO(dateString: string): Date
  export function isAfter(date: Date, dateToCompare: Date): boolean
  export function isBefore(date: Date, dateToCompare: Date): boolean
  export function addDays(date: Date, amount: number): Date
  export function differenceInDays(dateLeft: Date, dateRight: Date): number
  export function isPast(date: Date): boolean
  export function isValid(date: any): boolean
  export function subDays(date: Date, amount: number): Date
  export { format as formatDate }
}
