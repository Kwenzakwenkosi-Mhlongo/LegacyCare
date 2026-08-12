"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import TaskMetricCard from "@/components/dashboard/metriccard/staff/TaskMetricCard";

import TaskDetails from "@/components/modals/clerk/task/TaskDetails";

import { getTasks } from "@/lib/taskService";

import type { TaskResponse } from "@/types/task";

import { useNotifications } from "@/components/notifications/NotificationContext";

const taskStatusLabels: Record<number, string> = {
  0: "Not Started",
  1: "Completed",
  2: "In Progress",
};

function getTaskStatusLabel(status: number | string): string {
  if (typeof status === "number") {
    return taskStatusLabels[status] ?? "Unknown";
  }
  const num = parseInt(status as string);
  if (!isNaN(num)) {
    return taskStatusLabels[num] ?? "Unknown";
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
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const taskData = await getTasks();
    setTasks(taskData);

    setSelectedTask((currentSelectedTask) => {
      if (!currentSelectedTask) {
        return null;
      }
      return taskData.find((task: TaskResponse) => task.taskId === currentSelectedTask.taskId) ?? null;
    });
  }, []);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true);
        await loadTasks();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load tasks.";
        addNotification({
          title: "Task Loading Failed",
          message,
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadPageData();
  }, [addNotification, loadTasks]);

  const taskMetrics = useMemo(() => {
    const completedTask = tasks.filter(
      (task: TaskResponse) => getTaskStatusLabel(task.status) === "Completed"
    ).length;

    const pendingTask = tasks.filter(
      (task: TaskResponse) => getTaskStatusLabel(task.status) !== "Completed"
    ).length;

    const overdueTask = tasks.filter(isTaskOverdue).length;

    return {
      total: tasks.length,
      pending: pendingTask,
      completed: completedTask,
      overdue: overdueTask,
    };
  }, [tasks]);

  const tableData: TaskTableRow[] = useMemo(
    () =>
      tasks.map((task: TaskResponse) => ({
        ...task,
        selected: task.taskId === selectedTaskId,
        displayStatus: getTaskStatusLabel(task.status),
        displayDueDate: formatDate(task.dueDate),
      })),
    [tasks, selectedTaskId]
  );

  const columns = [
    {
      key: "task",
      label: "Task",
      render: (row: TaskTableRow) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-medium text-gray-900">{row.title}</div>
            <div className="text-sm text-gray-500">{row.taskId}</div>
          </div>
        </div>
      ),
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
  ];

  const handleViewTask = (task: TaskTableRow) => {
    setSelectedTask(task);
    setSelectedTaskId(task.taskId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manage Tasks" />
        <ComponentCard title="Tasks">
          <div className="py-12 text-center">
            <p className="text-gray-500">Loading tasks...</p>
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
            <ReusableTable
              columns={columns}
              data={tableData}
              onRowClick={handleViewTask}
            />

            {tasks.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No tasks were found.</p>
              </div>
            )}
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="Task Details">
            {selectedTask ? (
              <TaskDetails task={selectedTask} />
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">Select a task to view details</p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}