"use client";

import InfoRow from "@/components/reusables/InfoRow";

import {
  ListIcon,
  DocsIcon,
  CalenderIcon,
  ProgressIcon,
  CoffinIcon,
  EventIcon,
  UserIcon,
} from "@/icons";

import type { TaskResponse } from "@/types/task";

interface TaskDetailsProps {
  task: TaskResponse;
}

const taskStatusLabels: Record<number, string> = {
  0: "Not Started",
  1: "Completed",
  2: "In Progress",
};

function getTaskStatusLabel(status: number | string): string {
  if (typeof status === "number") {
    return taskStatusLabels[status] ?? "Unknown";
  }

  const numericStatus = Number(status);

  if (status.trim() !== "" && !Number.isNaN(numericStatus)) {
    return taskStatusLabels[numericStatus] ?? "Unknown";
  }

  return status;
}

function formatDate(date?: string | null): string {
  if (!date) {
    return "Not Available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-ZA");
}

export default function TaskDetails({ task }: TaskDetailsProps) {
  const statusLabel = getTaskStatusLabel(task.status);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="p-6 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {task.title}
            </h2>

            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                statusLabel === "Completed"
                  ? "border-green-300 bg-green-100 text-green-700"
                  : statusLabel === "In Progress"
                  ? "border-blue-300 bg-blue-100 text-blue-700"
                  : "border-yellow-300 bg-yellow-100 text-yellow-700"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Task ID: {task.taskId}
          </p>

          <p className="text-sm text-gray-500">
            Created: {formatDate(task.createdDate)}
          </p>
        </div>
      </div>

      <div className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Task Information
        </h3>

        <div className="space-y-4">
          <InfoRow icon={<ListIcon />} label="Task Name" value={task.title} />

          <InfoRow
            icon={<DocsIcon />}
            label="Description"
            value={task.description ?? "No Description"}
          />

          <InfoRow
            icon={<CalenderIcon />}
            label="Due Date"
            value={formatDate(task.dueDate)}
          />

          <InfoRow icon={<ProgressIcon />} label="Status" value={statusLabel} />

          {task.assignedTo && (
            <InfoRow
              icon={<UserIcon />}
              label="Assigned To"
              value={task.assignedTo.fullName ?? "Not Assigned"}
            />
          )}
        </div>

        <h3 className="mb-4 mt-8 text-sm font-semibold text-gray-700">
          Related Information
        </h3>

        <div className="space-y-4">
          <InfoRow
            icon={<CoffinIcon />}
            label="Deceased Name"
            value={task.deceasedName ?? "Not Related"}
          />

          <InfoRow
            icon={<EventIcon />}
            label="Event Name"
            value={task.eventName ?? "Not Related"}
          />
        </div>
      </div>
    </div>
  );
}