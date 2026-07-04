import type { Task } from "@/types/task";

const createdAt = "2026-06-24T13:00:00.000Z";
const updatedAt = "2026-07-02T14:30:00.000Z";

type SeedTask = Pick<Task, "id" | "title" | "client" | "category" | "priority"> &
  Partial<Omit<Task, "id" | "title" | "client" | "category" | "priority">>;

function makeTask(seed: SeedTask, sortOrder: number): Task {
  return {
    estimatedTime: "1 hr",
    status: "Not Started",
    invoiceStatus: "Not Needed",
    recurrence: "None",
    isToday: false,
    nextStep: "",
    focusChecklist: [],
    notes: "",
    timeEntries: [],
    statusChangedAt: createdAt,
    priorityChangedAt: createdAt,
    createdAt,
    updatedAt,
    sortOrder,
    ...seed
  };
}

/**
 * Visitor-facing demo data. On first load, each browser copies this list into
 * localStorage and receives an independent workspace to explore.
 */
export const seedTasks: Task[] = [
  makeTask(
    {
      id: "demo-launch-campaign",
      title: "Launch summer campaign",
      client: "Northstar Coffee",
      category: "Deadline",
      priority: "Critical",
      estimatedTime: "3 hrs",
      deadline: "Today at 4:00 PM",
      status: "In Progress",
      isToday: true,
      nextStep: "Approve the final ad set and schedule the campaign.",
      focusChecklist: ["Review copy", "Check mobile layouts", "Schedule ads"],
      notes: "Creative and landing page are approved. Final ad review remains.",
      timeEntries: [
        {
          id: "demo-time-launch",
          startedAt: "2026-07-02T13:00:00.000Z",
          endedAt: "2026-07-02T14:05:00.000Z",
          durationMs: 3_900_000
        }
      ],
      statusChangedAt: "2026-07-02T13:00:00.000Z"
    },
    0
  ),
  makeTask(
    {
      id: "demo-website-qa",
      title: "Complete website QA",
      client: "Cedar & Stone",
      category: "Client Delivery",
      priority: "Critical",
      estimatedTime: "2 hrs",
      deadline: "Tomorrow",
      isToday: true,
      nextStep: "Test checkout on mobile and tablet breakpoints.",
      focusChecklist: ["Test forms", "Check responsive layouts", "Run Lighthouse"],
      notes: "Use the production-readiness checklist before client handoff."
    },
    1
  ),
  makeTask(
    {
      id: "demo-brand-invoice",
      title: "Send brand package invoice",
      client: "Brightline Studio",
      category: "To Invoice",
      priority: "High",
      estimatedTime: "20 min",
      deadline: "Today",
      invoiceStatus: "Invoice Needed",
      isToday: true,
      nextStep: "Create the final invoice from the approved estimate.",
      notes: "Project total: $4,800. Deposit has already been paid."
    },
    0
  ),
  makeTask(
    {
      id: "demo-product-photos",
      title: "Edit product photography",
      client: "Northstar Coffee",
      category: "Client Delivery",
      priority: "High",
      estimatedTime: "4 hrs",
      deadline: "Friday",
      status: "In Progress",
      nextStep: "Finish color correction on the lifestyle selects.",
      focusChecklist: ["Color correction", "Retouch selects", "Export web sizes"],
      notes: "Twenty-four final images are due for the online store.",
      timeEntries: [
        {
          id: "demo-time-photos",
          startedAt: "2026-07-01T17:10:00.000Z",
          endedAt: "2026-07-01T18:55:00.000Z",
          durationMs: 6_300_000
        }
      ]
    },
    1
  ),
  makeTask(
    {
      id: "demo-client-feedback",
      title: "Review homepage feedback",
      client: "Harbor Health",
      category: "Client Delivery",
      priority: "High",
      estimatedTime: "45 min",
      deadline: "Thursday",
      status: "Waiting",
      nextStep: "Continue when the client sends revised compliance copy.",
      notes: "Design feedback is resolved; legal copy is still pending."
    },
    2
  ),
  makeTask(
    {
      id: "demo-weekly-planning",
      title: "Weekly project planning",
      client: "Internal",
      category: "Admin",
      priority: "Medium",
      estimatedTime: "30 min",
      deadline: "Monday morning",
      recurrence: "Weekly",
      nextStep: "Review active projects and set the week's top three outcomes.",
      focusChecklist: ["Review deadlines", "Check capacity", "Set priorities"]
    },
    0
  ),
  makeTask(
    {
      id: "demo-maintenance-report",
      title: "Prepare maintenance report",
      client: "Greenway Homes",
      category: "Systems",
      priority: "Medium",
      deadline: "July 8",
      invoiceStatus: "Sent",
      recurrence: "Monthly",
      nextStep: "Export uptime and analytics data for June.",
      notes: "Include security updates, uptime, traffic, and recommended actions."
    },
    1
  ),
  makeTask(
    {
      id: "demo-discovery-call",
      title: "Prepare for discovery call",
      client: "Atlas Outdoor",
      category: "Future",
      priority: "Medium",
      estimatedTime: "30 min",
      deadline: "Next Tuesday",
      nextStep: "Review their current site and draft five discovery questions.",
      notes: "Potential ecommerce redesign and ongoing content engagement."
    },
    2
  ),
  makeTask(
    {
      id: "demo-process-docs",
      title: "Document client onboarding",
      client: "Internal",
      category: "Systems",
      priority: "Low",
      estimatedTime: "2 hrs",
      status: "In Progress",
      nextStep: "Add the kickoff meeting and asset-request templates.",
      focusChecklist: ["Map workflow", "Add templates", "Publish handbook"],
      timeEntries: [
        {
          id: "demo-time-docs",
          startedAt: "2026-06-30T14:00:00.000Z",
          endedAt: "2026-06-30T14:50:00.000Z",
          durationMs: 3_000_000
        }
      ]
    },
    0
  ),
  makeTask(
    {
      id: "demo-subscriptions",
      title: "Review software subscriptions",
      client: "Internal",
      category: "Admin",
      priority: "Low",
      estimatedTime: "45 min",
      deadline: "End of month",
      recurrence: "Annual",
      nextStep: "Compare current seats against actual usage."
    },
    1
  ),
  makeTask(
    {
      id: "demo-case-study",
      title: "Write ecommerce case study",
      client: "Marketing",
      category: "Future",
      priority: "Backlog",
      estimatedTime: "3 hrs",
      nextStep: "Request permission to publish performance metrics.",
      notes: "Show the redesign process and the lift in completed checkouts."
    },
    0
  ),
  makeTask(
    {
      id: "demo-paid-invoice",
      title: "Archive paid campaign invoice",
      client: "Brightline Studio",
      category: "To Invoice",
      priority: "Backlog",
      estimatedTime: "10 min",
      status: "Done",
      invoiceStatus: "Paid",
      notes: "Payment received in full.",
      timeEntries: [
        {
          id: "demo-time-invoice",
          startedAt: "2026-07-01T13:00:00.000Z",
          endedAt: "2026-07-01T13:12:00.000Z",
          durationMs: 720_000
        }
      ],
      statusChangedAt: "2026-07-01T13:12:00.000Z"
    },
    1
  )
];
