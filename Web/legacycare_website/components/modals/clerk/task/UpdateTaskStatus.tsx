"use client";

import { useEffect, useState } from "react";

import Select from "@/components/form/Select";
import EditableRow from "@/components/reusables/EditableRow";

import {
  PencilIcon,
  CheckLineIcon,
  CloseLineIcon,
} from "@/icons";

import type { TaskResponse } from "@/types/task";

interface UpdateTaskStatusProps {
  task: TaskResponse;
  onSave: (taskId: string, status: number) => Promise<void>;
  onCancel: () => void;
}

const taskStatusLabels: Record<number, string> = {
  0: "Not Started",
  1: "In Progress",
  2: "Completed",
};

function getStatusNumber(status: number | string): number {
  if (typeof status === "number") {
    return status;
  }

  const numericStatus = Number(status);

  if (status.trim() !== "" && !Number.isNaN(numericStatus)) {
    return numericStatus;
  }

  switch (status) {
    case "In Progress":
      return 1;
    case "Completed":
      return 2;
    case "Not Started":
    case "Pending":
    default:
      return 0;
  }
}

function getStatusLabel(status: number): string {
  return taskStatusLabels[status] ?? "Unknown";
}

export default function UpdateTaskStatus({
  task,
  onSave,
  onCancel,
}: UpdateTaskStatusProps) {
  const [status, setStatus] = useState<number>(getStatusNumber(task.status));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatus(getStatusNumber(task.status));
  }, [task]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(task.taskId, status);
    } finally {
      setIsSaving(false);
    }
  };

  const statusLabel = getStatusLabel(status);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Update Task Status
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {task.taskId}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    statusLabel === "Completed"
                      ? "bg-green-100 text-green-700"
                      : statusLabel === "In Progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-5">
          <h3 className="mb-4 mt-8 text-sm font-semibold text-gray-700">
            Task Status
          </h3>

          <EditableRow icon={<CheckLineIcon />} label="Status">
            <Select
              key={`${task.taskId}-${status}`}
              defaultValue={String(status)}
              onChange={(value: string) => setStatus(Number(value))}
             options={[
    { value: "0", label: "Not Started" },
    { value: "1", label: "In Progress" },
    { value: "2", label: "Completed" },
]}
            />
          </EditableRow>
        </div>
      </div>

      <div className="flex gap-3 border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CloseLineIcon />
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilIcon />
          {isSaving ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
}