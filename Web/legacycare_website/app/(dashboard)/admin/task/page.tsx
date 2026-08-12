"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import TaskMetricCard from "@/components/dashboard/metriccard/admin/TaskMetricCard";

import TaskDetails from "@/components/modals/admin/task/TaskDetails";
import EditTaskDetails from "@/components/modals/admin/task/EditTaskDetails";
import DeleteConfirmation from "@/components/modals/confirmation/DeleteConfirmation";

import {
  deleteTask,
  getTasks,
  updateTask,
} from "@/lib/taskService";

import {
  getDeceasedLookup,
  getEventLookup,
  getStaffLookup,
} from "@/lib/services/taskLookupService";

import type {
  DeceasedLookupResponse,
  EventLookupResponse,
  StaffLookupResponse,
  TaskResponse,
  UpdateTaskRequest,
} from "@/types/task";

import { useNotifications } from "@/components/notifications/NotificationContext";

const taskStatusLabels: Record<string, string> = {
  "NotStarted": "Not Started",
  "InProgress": "In Progress",
  "Completed": "Completed",
};

function getTaskStatusLabel(status: string | number): string {
  if (typeof status === "string") {
    return taskStatusLabels[status] ?? status;
  }
  const statusMap: Record<number, string> = {
    0: "NotStarted",
    1: "Completed",
    2: "InProgress",
  };
  const statusKey = statusMap[status] ?? "Unknown";
  return taskStatusLabels[statusKey] ?? statusKey;
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

function isTaskOverdue(task: TaskResponse): boolean {
  if (!task.dueDate) {
    return false;
  }
  const status = getTaskStatusLabel(task.status);
  if (status === "Completed") {
    return false;
  }
  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

interface TaskTableRow extends TaskResponse {
  selected: boolean;
  displayStatus: string;
  displayDueDate: string;
}

export default function TasksPage() {
  const { addNotification } = useNotifications();

  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffLookupResponse[]>([]);
  const [deceasedRecords, setDeceasedRecords] = useState<DeceasedLookupResponse[]>([]);
  const [events, setEvents] = useState<EventLookupResponse[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editTask, setEditTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const rowsPerPage = 5;

  useEffect(() => {
    document.title = "Manage Tasks";
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      try {
        setIsLoading(true);

        const results = await Promise.allSettled([
          getTasks(),
          getStaffLookup(),
          getDeceasedLookup(),
          getEventLookup(),
        ]);

        if (!isMounted) return;

        const [taskResult, staffResult, deceasedResult, eventResult] = results;

        if (taskResult.status === "fulfilled") {
          setTasks(taskResult.value);
        } else {
          setTasks([]);
          addNotification({
            title: "Task Loading Failed",
            message: taskResult.reason instanceof Error ? taskResult.reason.message : "Unable to retrieve tasks.",
            type: "error",
          });
        }

        if (staffResult.status === "fulfilled") {
          setStaffMembers(staffResult.value);
        } else {
          setStaffMembers([]);
        }

        if (deceasedResult.status === "fulfilled") {
          setDeceasedRecords(deceasedResult.value);
        } else {
          setDeceasedRecords([]);
        }

        if (eventResult.status === "fulfilled") {
          setEvents(eventResult.value);
        } else {
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshTasks(preferredTaskId?: string): Promise<TaskResponse[]> {
    const refreshedTasks = await getTasks();
    setTasks(refreshedTasks);

    if (!preferredTaskId) {
      return refreshedTasks;
    }

    const refreshedTask = refreshedTasks.find((task: TaskResponse) => task.taskId === preferredTaskId) ?? null;
    setSelectedTask(refreshedTask);
    setSelectedTaskId(refreshedTask?.taskId ?? "");
    if (!refreshedTask) {
      setEditTask(false);
    }

    return refreshedTasks;
  }

  const taskMetrics = useMemo(() => {
    const completedTask = tasks.filter((task) => getTaskStatusLabel(task.status) === "Completed").length;
    const pendingTask = tasks.filter((task) => getTaskStatusLabel(task.status) !== "Completed").length;
    const overdueTask = tasks.filter(isTaskOverdue).length;

    return {
      total: tasks.length,
      pending: pendingTask,
      completed: completedTask,
      overdue: overdueTask,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task: TaskResponse) => {
      const status = getTaskStatusLabel(task.status);
      const taskId = task.taskId ?? "";
      const title = task.title ?? "";
      const description = task.description ?? "";
      const staffName = task.staffName ?? "";
      const deceasedName = task.deceasedName ?? "";
      const eventName = task.eventName ?? "";

      const matchesSearch =
        normalizedSearch === "" ||
        taskId.toLowerCase().includes(normalizedSearch) ||
        title.toLowerCase().includes(normalizedSearch) ||
        description.toLowerCase().includes(normalizedSearch) ||
        staffName.toLowerCase().includes(normalizedSearch) ||
        deceasedName.toLowerCase().includes(normalizedSearch) ||
        eventName.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTasks.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredTasks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const tableData: TaskTableRow[] = useMemo(
    () =>
      paginatedTasks.map((task: TaskResponse) => ({
        ...task,
        selected: task.taskId === selectedTaskId,
        displayStatus: getTaskStatusLabel(task.status),
        displayDueDate: formatDate(task.dueDate),
      })),
    [paginatedTasks, selectedTaskId]
  );

  const columns = [
    {
      key: "task",
      label: "Task",
      render: (row: TaskTableRow) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.taskId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "staffName",
      label: "Assigned Staff",
      render: (row: TaskTableRow) => <span>{row.staffName ?? "Not Assigned"}</span>,
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (row: TaskTableRow) => <span>{row.displayDueDate}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: TaskTableRow) => {
        const status = row.displayStatus;
        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              status === "Completed"
                ? "bg-green-100 text-green-700"
                : status === "In Progress"
                ? "bg-blue-100 text-blue-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "options",
      label: "Options",
    },
  ];

  function handleViewTask(task: TaskTableRow) {
    setSelectedTask(task);
    setSelectedTaskId(task.taskId);
    setEditTask(false);
  }

  function handleEditTask() {
    if (!selectedTask) return;
    setEditTask(true);
  }

  async function handleSaveTask(taskId: string, data: UpdateTaskRequest) {
    try {
      await updateTask(taskId, data);
      await refreshTasks(taskId);
      setEditTask(false);
      addNotification({
        title: "Task Updated",
        message: "The task was updated successfully.",
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the task.";
      addNotification({
        title: "Task Update Failed",
        message,
        type: "error",
      });
      throw error;
    }
  }

  function handleDeleteTask() {
    if (!selectedTask) return;
    setDeleteModal(true);
  }

  async function handleConfirmDelete() {
    if (!selectedTask || isDeleting) return;

    const taskId = selectedTask.taskId;

    try {
      setIsDeleting(true);
      await deleteTask(taskId);
      setTasks((previousTasks: TaskResponse[]) => previousTasks.filter((task: TaskResponse) => task.taskId !== taskId));
      setDeleteModal(false);
      setSelectedTask(null);
      setSelectedTaskId("");
      setEditTask(false);
      addNotification({
        title: "Task Deleted",
        message: "The task was deleted successfully.",
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete the task.";
      addNotification({
        title: "Task Deletion Failed",
        message,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manage Tasks" />
        <ComponentCard title="Tasks">
          <div className="py-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manage Tasks" />

      <TaskMetricCard
        totTask={taskMetrics.total}
        pendingTask={taskMetrics.pending}
        completedTask={taskMetrics.completed}
        overdueTask={taskMetrics.overdue}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <ComponentCard title="Tasks">
            <div className="mb-4 flex w-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <Link href="/admin/task/create" className="text-sm font-medium text-teal-600 hover:text-teal-700">
                  + Add New Task
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search tasks..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:flex-1"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-teal-600 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <ReusableTable
              columns={columns}
              data={tableData}
              onRowClick={handleViewTask}
              onEdit={(task: TaskTableRow) => {
                setSelectedTask(task);
                setSelectedTaskId(task.taskId);
                setEditTask(true);
              }}
              onDelete={(task: TaskTableRow) => {
                setSelectedTask(task);
                setSelectedTaskId(task.taskId);
                setDeleteModal(true);
              }}
            />

            {filteredTasks.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks were found.</p>
              </div>
            )}

            {filteredTasks.length > 0 && (
              <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((previousPage) => Math.max(1, previousPage - 1))}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((previousPage) => Math.min(totalPages, previousPage + 1))}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title={editTask ? "Edit Task" : "Task Details"}>
            {selectedTask ? (
              editTask ? (
                <EditTaskDetails
                  task={selectedTask}
                  staffMembers={staffMembers}
                  deceasedRecords={deceasedRecords}
                  events={events}
                  onCancel={() => setEditTask(false)}
                  onSave={handleSaveTask}
                />
              ) : (
                <TaskDetails
                  task={selectedTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              )
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Select a task to view details</p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={deleteModal}
        itemName={selectedTask?.title ?? ""}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModal(false);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}