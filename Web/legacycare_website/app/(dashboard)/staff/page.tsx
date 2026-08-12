"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import TaskMetricCard from "@/components/dashboard/metriccard/staff/TaskMetricCard";
import TaskDetails from "@/components/modals/clerk/task/TaskDetails";
import UpdateTaskStatus from "@/components/modals/clerk/task/UpdateTaskStatus";

import type { TaskResponse } from "@/types/task";

export default function TasksPage() {
    /* ---------------- STATES ---------------- */

    const [selectedTask, setSelectedTask] =
        useState<TaskResponse | null>(null);

    const [selectedTaskId, setSelectedTaskId] = useState("");

    const [editStatus, setEditStatus] = useState(false);

    const [tasks, setTasks] = useState<TaskResponse[]>([]);

    const [loading, setLoading] = useState(true);

    /* ---------------- STATUS HELPERS ---------------- */

    const getStatusText = (status: any): string => {
        if (typeof status === "number") {
            switch (status) {
                case 0:
                    return "Not Started";
                case 1:
                    return "In Progress";
                case 2:
                    return "Completed";
                default:
                    return "Not Started";
            }
        }

        switch (status) {
            case "NotStarted":
                return "Not Started";

            case "InProgress":
                return "In Progress";

            case "Completed":
                return "Completed";

            case "Not Started":
                return "Not Started";

            case "In Progress":
                return "In Progress";

            default:
                return status || "Not Started";
        }
    };

    /* ---------------- LOAD TASKS ---------------- */

    useEffect(() => {
        const loadTasks = async () => {
            try {
                setLoading(true);

                const token = localStorage.getItem("authToken");

                if (!token) {
                    alert("You are not logged in.");
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/Task`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();

                    console.error(
                        "Load tasks error:",
                        errorText
                    );

                    alert(
                        errorText ||
                            "Failed to load tasks."
                    );

                    return;
                }

                const data = await response.json();

                console.log("Tasks received:", data);

                const normalizedTasks: TaskResponse[] =
                    data.map((task: any) => ({
                        ...task,

                        taskId: String(task.taskId),

                        title:
                            task.title ||
                            "Untitled Task",

                        description:
                            task.description || "",

                        dueDate:
                            task.dueDate || "",

                        status:
                            getStatusText(task.status),
                    }));

                setTasks(normalizedTasks);
            } catch (error) {
                console.error(
                    "Load tasks error:",
                    error
                );

                alert(
                    "Unable to load tasks."
                );
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, []);

    /* ---------------- TABLE COLUMNS ---------------- */

    const columns = [
        {
            key: "task",
            label: "Task",

            render: (row: TaskResponse) => (
                <div className="flex items-center gap-3">
                    <div>
                        <div className="font-medium text-gray-900">
                            {row.title}
                        </div>

                        <div className="text-sm text-gray-500">
                            {row.taskId}
                        </div>
                    </div>
                </div>
            ),
        },

        {
            key: "dueDate",
            label: "Due Date",

            render: (row: TaskResponse) => (
                <span>
                    {row.dueDate
                        ? new Date(
                              row.dueDate
                          ).toLocaleDateString()
                        : "-"}
                </span>
            ),
        },

        {
            key: "status",
            label: "Status",

            render: (row: TaskResponse) => {
                const status = getStatusText(
                    row.status
                );

                return (
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            status === "Completed"
                                ? "bg-green-100 text-green-700"
                                : status ===
                                  "In Progress"
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

    /* ---------------- VIEW TASK ---------------- */

    const handleViewTask = (
        task: TaskResponse
    ) => {
        setSelectedTask(task);

        setSelectedTaskId(
            task.taskId
        );

        setEditStatus(false);
    };

    /* ---------------- EDIT STATUS ---------------- */

    const handleEditTask = (
        task: TaskResponse
    ) => {
        setSelectedTask(task);

        setSelectedTaskId(
            task.taskId
        );

        setEditStatus(true);
    };

    /* ---------------- UPDATE STATUS ---------------- */

    const handleSaveStatus = async (
        taskId: string,
        status: number
    ): Promise<void> => {
        try {
            const token =
                localStorage.getItem(
                    "authToken"
                );

            if (!token) {
                alert(
                    "You are not logged in."
                );

                return;
            }

            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/Task/${taskId}/status?status=${status}`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                const errorText =
                    await response.text();

                console.error(
                    "Update task status error:",
                    errorText
                );

                alert(
                    errorText ||
                        "Failed to update task status."
                );

                return;
            }

            const statusText =
                getStatusText(status);

            /* Update table */

            setTasks(
                (previousTasks) =>
                    previousTasks.map(
                        (task) =>
                            task.taskId ===
                            taskId
                                ? {
                                      ...task,
                                      status:
                                          statusText,
                                  }
                                : task
                    )
            );

            /* Update selected task */

            setSelectedTask(
                (previousTask) =>
                    previousTask &&
                    previousTask.taskId ===
                        taskId
                        ? {
                              ...previousTask,
                              status:
                                  statusText,
                          }
                        : previousTask
            );

            setEditStatus(false);

            alert(
                "Task status updated successfully."
            );
        } catch (error) {
            console.error(
                "Update task status error:",
                error
            );

            alert(
                "Unable to update task status."
            );
        }
    };

    /* ---------------- METRICS ---------------- */

    const totalTasks =
        tasks.length;

    const pendingTasks =
        tasks.filter(
            (task) =>
                getStatusText(
                    task.status
                ) === "Not Started"
        ).length;

    const completedTasks =
        tasks.filter(
            (task) =>
                getStatusText(
                    task.status
                ) === "Completed"
        ).length;

    const overdueTasks =
        tasks.filter((task) => {
            if (!task.dueDate) {
                return false;
            }

            const status =
                getStatusText(
                    task.status
                );

            if (
                status === "Completed"
            ) {
                return false;
            }

            return (
                new Date(
                    task.dueDate
                ) < new Date()
            );
        }).length;

    /* ---------------- PAGE ---------------- */

    return (
        <div className="space-y-6">
            {/* PAGE HEADER */}

            <PageBreadcrumb
                pageTitle="Manage Tasks"
            />

            {/* METRIC CARDS */}

            <TaskMetricCard
                totTask={totalTasks}
                pendingTask={pendingTasks}
                completedTask={
                    completedTasks
                }
                overdueTask={
                    overdueTasks
                }
            />

            {/* TABLE + DETAILS */}

            <div className="grid grid-cols-12 gap-6">
                {/* TASK TABLE */}

                <div className="col-span-8">
                    <ComponentCard title="Tasks">
                        <div className="mb-4 flex w-full items-center justify-between">
                            <Link
                                href="/admin/tasks"
                                className="text-sm font-medium text-teal-600"
                            >
                                View All
                            </Link>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">
                                    Loading tasks...
                                </p>
                            </div>
                        ) : tasks.length ===
                          0 ? (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">
                                    No tasks found.
                                </p>
                            </div>
                        ) : (
                            <ReusableTable
                                columns={
                                    columns
                                }
                                data={tasks}
                                onRowClick={
                                    handleViewTask
                                }
                                onEdit={
                                    handleEditTask
                                }
                            />
                        )}
                    </ComponentCard>
                </div>

                {/* DETAILS PANEL */}

                <div className="col-span-4">
                    <ComponentCard
                        title={
                            editStatus
                                ? "Edit Status"
                                : "Task Details"
                        }
                    >
                        {selectedTask ? (
                            editStatus ? (
                                <UpdateTaskStatus
                                    task={
                                        selectedTask
                                    }

                                    onCancel={() =>
                                        setEditStatus(
                                            false
                                        )
                                    }

                                    onSave={
                                        handleSaveStatus
                                    }
                                />
                            ) : (
                                <TaskDetails
                                    task={
                                        selectedTask
                                    }
                                />
                            )
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">
                                    Select a task
                                    to view
                                    details
                                </p>
                            </div>
                        )}
                    </ComponentCard>
                </div>
            </div>
        </div>
    );
}