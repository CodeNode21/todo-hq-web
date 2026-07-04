export type Priority = "Critical" | "High" | "Medium" | "Low" | "Backlog";

export type Category =
  | "To Invoice"
  | "Client Delivery"
  | "Deadline"
  | "Admin"
  | "Systems"
  | "Future";

export type Status = "Not Started" | "In Progress" | "Waiting" | "Done";
export type InvoiceStatus = "Not Needed" | "Invoice Needed" | "Sent" | "Follow Up" | "Paid";
export type Recurrence = "None" | "Daily" | "Weekly" | "Monthly" | "Annual";

export interface TimeEntry {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
}

export interface ClientRecord {
  name: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  client: string;
  clientLogoUrl?: string;
  category: Category;
  priority: Priority;
  estimatedTime: string;
  deadline?: string;
  status: Status;
  invoiceStatus: InvoiceStatus;
  recurrence: Recurrence;
  isToday: boolean;
  sortOrder: number;
  nextStep: string;
  focusChecklist: string[];
  notes: string;
  timeEntries: TimeEntry[];
  activeTimerStartedAt?: string;
  statusChangedAt: string;
  priorityChangedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskDraft = Omit<
  Task,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "timeEntries"
  | "activeTimerStartedAt"
  | "statusChangedAt"
  | "priorityChangedAt"
  | "sortOrder"
>;

export const priorities: Priority[] = ["Critical", "High", "Medium", "Low", "Backlog"];

export const categories: Category[] = [
  "To Invoice",
  "Client Delivery",
  "Deadline",
  "Admin",
  "Systems",
  "Future"
];

export const statuses: Status[] = ["Not Started", "In Progress", "Waiting", "Done"];
export const invoiceStatuses: InvoiceStatus[] = [
  "Not Needed",
  "Invoice Needed",
  "Sent",
  "Follow Up",
  "Paid"
];
export const recurrences: Recurrence[] = ["None", "Daily", "Weekly", "Monthly", "Annual"];
