export type TaskStatus = "NotStarted" | "InProgress" | "Completed";

export interface TaskResponse {
  taskId: string;
  title: string;
  description: string;
  status: string | number;
  startDate: string;
  dueDate: string;
  assignedToId: string;
  policyId?: string;
  deceasedId?: string;
  eventId?: string;
  createdDate: string;
  proofImagePath?: string;
  staffName?: string;
  staffRole?: string;
  deceasedName?: string;
  eventName?: string;
  assignedTo?: {
    userId: string;
    fullName: string;
    email: string;
    role?: string;
  };
  policy?: {
    policyId: string;
    package?: {
      name: string;
    };
  };
  deceased?: {
    deceasedId: string;
    fullName: string;
  };
  event?: {
    eventId: string;
    title: string;
  };
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  assignedToId: string;
  deceasedId: string | null;
  eventId: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  dueDate: string;           // ← Required
  assignedToId: string;      // ← Required
  deceasedId: string | null;
  eventId: string | null;
}

export interface StaffLookupResponse {
  staffId: string;
  userId: string;
  displayStaffId?: string;
  fullName: string;
  roleName: string;
}

export interface DeceasedLookupResponse {
  deceasedId: string;
  fullName: string;
  idNumber?: string;
}

export interface EventLookupResponse {
  eventId: string;
  eventName: string;
  eventDate?: string;
}