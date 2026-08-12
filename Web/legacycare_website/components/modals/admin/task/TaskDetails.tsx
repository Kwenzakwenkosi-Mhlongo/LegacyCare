"use client";

import { TaskResponse } from "@/types/task";

interface TaskDetailsProps {
  task: TaskResponse;
  onEdit: () => void;
  onDelete: () => void;
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

function getStatusLabel(status: string | number): string {
  if (typeof status === "string") {
    switch (status) {
      case "Completed": return "Completed";
      case "InProgress": return "In Progress";
      default: return "Not Started";
    }
  }
  switch (status) {
    case 2: return "Completed";
    case 1: return "In Progress";
    default: return "Not Started";
  }
}

function getStatusColor(status: string | number): string {
  const label = getStatusLabel(status);
  switch (label) {
    case "Completed": return "text-green-700 bg-green-100";
    case "In Progress": return "text-blue-700 bg-blue-100";
    default: return "text-yellow-700 bg-yellow-100";
  }
}

export default function TaskDetails({ task, onEdit, onDelete }: TaskDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>

      {task.description && (
        <div>
          <p className="text-sm text-gray-600">{task.description}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-400">Task ID: {task.taskId}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Due Date</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(task.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Assigned Staff</p>
          <p className="text-sm font-medium text-gray-900">
            {task.assignedTo?.fullName || "Not Assigned"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="text-sm font-medium text-gray-900">
            {task.assignedTo?.role || "Not Assigned"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Related Deceased</p>
          <p className="text-sm font-medium text-gray-900">
            {task.deceased?.fullName || "Not Related"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500">Related Event</p>
          <p className="text-sm font-medium text-gray-900">
            {task.event?.title || "Not Related"}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
        >
          Edit Task
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Delete Task
        </button>
      </div>
    </div>
  );
}