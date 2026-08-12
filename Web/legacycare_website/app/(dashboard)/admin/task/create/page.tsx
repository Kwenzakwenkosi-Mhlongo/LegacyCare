"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import DefaultInputs from "@/components/form/form-elements/DefaultInputs";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import { createTask } from "@/lib/taskService";
import { getDeceasedLookup, getEventLookup, getStaffLookup } from "@/lib/services/taskLookupService";
import type { CreateTaskRequest, DeceasedLookupResponse, EventLookupResponse, StaffLookupResponse } from "@/types/task";
import { useNotifications } from "@/components/notifications/NotificationContext";

interface CreateTaskForm {
  title: string;
  description: string;
  dueDate: string;
  selectedRole: string;
  staffId: string;
  deceasedId: string;
  eventId: string;
}

const initialForm: CreateTaskForm = {
  title: "",
  description: "",
  dueDate: "",
  selectedRole: "",
  staffId: "",
  deceasedId: "",
  eventId: "",
};

export default function CreateTaskPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [form, setForm] = useState<CreateTaskForm>({ ...initialForm });
  const [staffMembers, setStaffMembers] = useState<StaffLookupResponse[]>([]);
  const [deceasedRecords, setDeceasedRecords] = useState<DeceasedLookupResponse[]>([]);
  const [events, setEvents] = useState<EventLookupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Create Task";
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLookupData() {
      try {
        setIsLoading(true);

        const [staffData, deceasedData, eventData] = await Promise.all([
          getStaffLookup(),
          getDeceasedLookup(),
          getEventLookup(),
        ]);

        if (!isMounted) return;

        setStaffMembers(staffData);
        setDeceasedRecords(deceasedData);
        setEvents(eventData);
      } catch (error) {
        if (!isMounted) return;

        const message = error instanceof Error ? error.message : "Unable to load task form information.";
        addNotification({
          title: "Loading Failed",
          message,
          type: "error",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLookupData();

    return () => {
      isMounted = false;
    };
  }, []);

  const staffRoles = useMemo(() => {
    const roles = staffMembers
      .map((staff) => staff.roleName)
      .filter((role): role is string => Boolean(role?.trim()));
    return Array.from(new Set(roles)).sort();
  }, [staffMembers]);

  const filteredStaffMembers = useMemo(() => {
    if (!form.selectedRole) {
      return staffMembers;
    }
    return staffMembers.filter((staff) => staff.roleName === form.selectedRole);
  }, [staffMembers, form.selectedRole]);

  const roleOptions = useMemo(
    () => [
      { value: "", label: "All Staff Roles" },
      ...staffRoles.map((role) => ({ value: role, label: role })),
    ],
    [staffRoles]
  );

  const staffOptions = useMemo(
    () =>
      filteredStaffMembers.map((staff) => ({
        value: staff.userId,
        label: `${staff.fullName} - ${staff.roleName ?? "No Role"}`,
      })),
    [filteredStaffMembers]
  );

  const deceasedOptions = useMemo(
    () => [
      { value: "", label: "No Related Deceased" },
      ...deceasedRecords.map((deceased) => ({
        value: deceased.deceasedId,
        label: `${deceased.deceasedId} - ${deceased.fullName}`,
      })),
    ],
    [deceasedRecords]
  );

  const eventOptions = useMemo(
    () => [
      { value: "", label: "No Related Event" },
      ...events.map((event) => ({
        value: event.eventId,
        label: `${event.eventId} - ${event.eventName}`,
      })),
    ],
    [events]
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function handleDescriptionChange(value: string) {
    setForm((previousForm) => ({
      ...previousForm,
      description: value,
    }));
  }

  function handleDateChange(_selectedDates: Date[], currentDateString: string) {
    setForm((previousForm) => {
      if (previousForm.dueDate === currentDateString) {
        return previousForm;
      }
      let formattedDate = currentDateString;
      if (currentDateString) {
        const dateObj = new Date(currentDateString);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString();
        }
      }
      return {
        ...previousForm,
        dueDate: formattedDate,
      };
    });
  }

  function handleRoleChange(value: string) {
    setForm((previousForm) => {
      if (previousForm.selectedRole === value) {
        return previousForm;
      }
      return {
        ...previousForm,
        selectedRole: value,
        staffId: "",
      };
    });
  }

  function handleStaffChange(value: string) {
    setForm((previousForm) => {
      if (previousForm.staffId === value) {
        return previousForm;
      }
      return {
        ...previousForm,
        staffId: value,
      };
    });
  }

  function handleDeceasedChange(value: string) {
    setForm((previousForm) => {
      if (previousForm.deceasedId === value) {
        return previousForm;
      }
      return {
        ...previousForm,
        deceasedId: value,
      };
    });
  }

  function handleEventChange(value: string) {
    setForm((previousForm) => {
      if (previousForm.eventId === value) {
        return previousForm;
      }
      return {
        ...previousForm,
        eventId: value,
      };
    });
  }

  const isFormValid =
    form.title.trim() !== "" &&
    form.description.trim() !== "" &&
    form.dueDate !== "" &&
    form.staffId !== "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    const request: CreateTaskRequest = {
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      assignedToId: form.staffId,
      deceasedId: form.deceasedId || null,
      eventId: form.eventId || null,
    };

    try {
      setIsSubmitting(true);
      await createTask(request);

      addNotification({
        title: "Task Created",
        message: "The task was created successfully.",
        type: "success",
      });

      router.push("/admin/task");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the task.";
      addNotification({
        title: "Task Creation Failed",
        message,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Create Task" />
        <ComponentCard title="Task Details">
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading task form...</p>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Create Task" />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <ComponentCard title="Task Details">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DefaultInputs
              label="Task Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter task title"
            />

            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Due Date</label>
              <DatePicker
                id="taskDueDate"
                placeholder="Select due date"
                onChange={handleDateChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Task Description</label>
              <TextArea
                value={form.description}
                onChange={handleDescriptionChange}
                rows={4}
                placeholder="Enter task description"
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Staff Assignment">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Required Staff Role</label>
              <Select
                options={roleOptions}
                placeholder="Select Required Staff Role"
                onChange={handleRoleChange}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Assigned Staff Member</label>
              <Select
                key={form.selectedRole || "all-staff"}
                options={staffOptions}
                placeholder={filteredStaffMembers.length > 0 ? "Select Staff Member" : "No staff available"}
                onChange={handleStaffChange}
              />
              {form.selectedRole && filteredStaffMembers.length === 0 && (
                <p className="mt-1 text-xs text-red-500">
                  No staff members were found for the selected role.
                </p>
              )}
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Related Deceased or Event (Optional)">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Related Deceased</label>
              <Select
                options={deceasedOptions}
                placeholder="Select Deceased"
                onChange={handleDeceasedChange}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-gray-600 dark:text-gray-400">Related Event</label>
              <Select
                options={eventOptions}
                placeholder="Select Event"
                onChange={handleEventChange}
              />
            </div>
          </div>
        </ComponentCard>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/task")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}