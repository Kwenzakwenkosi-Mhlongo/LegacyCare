"use client";

import { useEffect, useState } from "react";

import DefaultInputs from "@/components/form/form-elements/DefaultInputs";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import InfoRow from "@/components/reusables/InfoRow";
import EditableRow from "@/components/reusables/EditableRow";

import {
  PencilIcon,
  ListIcon,
  DocsIcon,
  CalenderIcon,
  ProgressIcon,
  UserIcon,
  BriefCaseIcon,
  CoffinIcon,
  EventIcon,
  CloseLineIcon,
} from "@/icons";

import type {
  StaffLookupResponse,
  DeceasedLookupResponse,
  EventLookupResponse,
  TaskResponse,
  UpdateTaskRequest,
} from "@/types/task";

interface EditTaskDetailsProps {
  task: TaskResponse;
  staffMembers: StaffLookupResponse[];
  deceasedRecords: DeceasedLookupResponse[];
  events: EventLookupResponse[];

  onSave: (
    taskId: string,
    data: UpdateTaskRequest
  ) => Promise<void>;

  onCancel: () => void;
}

const taskStatusLabels: Record<number, string> = {
  0: "Not Started",
  1: "Completed",
  2: "In Progress",
};

function getTaskStatusLabel(
  status: number | string
) {
  if (typeof status === "number") {
    return taskStatusLabels[status] ?? "Unknown";
  }
  return status;
}

function formatDateForPicker(
  date?: string | null
) {
  if (!date) {
    return "";
  }
  return date.split("T")[0];
}

export default function EditTaskDetails({
  task,
  staffMembers,
  deceasedRecords,
  events,
  onSave,
  onCancel,
}: EditTaskDetailsProps) {
  const [form, setForm] = useState<UpdateTaskRequest>({
    title: task.title ?? "",
    description: task.description ?? "",
    dueDate: formatDateForPicker(task.dueDate),
    assignedToId: task.assignedToId ?? "",
    deceasedId: task.deceasedId ?? null,
    eventId: task.eventId ?? null,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: task.title ?? "",
      description: task.description ?? "",
      dueDate: formatDateForPicker(task.dueDate),
      assignedToId: task.assignedToId ?? "",
      deceasedId: task.deceasedId ?? null,
      eventId: task.eventId ?? null,
    });
  }, [task]);

  const statusLabel = getTaskStatusLabel(task.status);

  const selectedStaff = staffMembers.find(
    (staff) => staff.userId === form.assignedToId
  ) ?? null;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Ensure dueDate is always a valid ISO string
      let dueDateISO = form.dueDate;
      if (dueDateISO) {
        const dateObj = new Date(dueDateISO);
        if (!isNaN(dateObj.getTime())) {
          dueDateISO = dateObj.toISOString();
        } else {
          dueDateISO = new Date().toISOString();
        }
      } else {
        dueDateISO = new Date().toISOString();
      }
      
      const updateData = {
        title: form.title,
        description: form.description,
        dueDate: dueDateISO,
        assignedToId: form.assignedToId,
        deceasedId: form.deceasedId || null,
        eventId: form.eventId || null,
      };
      
      await onSave(task.taskId, updateData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Edit Task Details
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
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Task Information
        </h3>

        <div className="space-y-5">
          <EditableRow
            icon={<ListIcon />}
            label="Task Name"
          >
            <DefaultInputs
              label=""
              name="title"
              value={form.title}
              onChange={handleInputChange}
            />
          </EditableRow>

          <EditableRow
            icon={<DocsIcon />}
            label="Description"
          >
            <TextArea
              rows={5}
              value={form.description}
              onChange={(value) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  description: value,
                }))
              }
            />
          </EditableRow>

          <EditableRow
            icon={<CalenderIcon />}
            label="Due Date"
          >
            <DatePicker
              id={`editDueDate-${task.taskId}`}
              defaultDate={form.dueDate}
              onChange={(_, dates) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  dueDate: dates[0] ?? "",
                }))
              }
            />
          </EditableRow>

          <InfoRow
            icon={<ProgressIcon />}
            label="Status"
            value={statusLabel}
          />
        </div>

        <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
          Assigned Staff Information
        </h3>

        <div className="space-y-5">
          <InfoRow
            icon={<BriefCaseIcon />}
            label="Role"
            value={
              selectedStaff?.roleName ??
              task.staffRole ??
              "Not Assigned"
            }
          />

          <EditableRow
            icon={<UserIcon />}
            label="Assigned Staff"
          >
            <Select
              defaultValue={form.assignedToId ?? ""}
              onChange={(value) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  assignedToId: value || "",
                }))
              }
              options={[
                {
                  value: "",
                  label: "Not Assigned",
                },
                ...staffMembers.map((staff) => ({
                  value: staff.userId,
                  label: `${staff.fullName} - ${staff.roleName}`,
                })),
              ]}
            />
          </EditableRow>
        </div>

        <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
          Related Deceased / Event Information
        </h3>

        <div className="space-y-5">
          <EditableRow
            icon={<CoffinIcon />}
            label="Deceased Name"
          >
            <Select
              defaultValue={form.deceasedId ?? ""}
              onChange={(value) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  deceasedId: value || null,
                }))
              }
              options={[
                {
                  value: "",
                  label: "Not Related",
                },
                ...deceasedRecords.map(
                  (deceased) => ({
                    value: deceased.deceasedId,
                    label: deceased.fullName,
                  })
                ),
              ]}
            />
          </EditableRow>

          <EditableRow
            icon={<EventIcon />}
            label="Event Name"
          >
            <Select
              defaultValue={form.eventId ?? ""}
              onChange={(value) =>
                setForm((previousForm) => ({
                  ...previousForm,
                  eventId: value || null,
                }))
              }
              options={[
                {
                  value: "",
                  label: "Not Related",
                },
                ...events.map((event) => ({
                  value: event.eventId,
                  label: event.eventName,
                })),
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
          disabled={
            isSaving ||
            !form.title.trim() ||
            !form.dueDate ||
            !form.assignedToId
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilIcon />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}