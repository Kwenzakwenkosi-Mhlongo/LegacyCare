"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import TaskMetricCard from "@/components/dashboard/metriccard/staff/TaskMetricCard";
import TaskDetails from "@/components/modals/clerk/task/TaskDetails";
import UpdateTaskStatus from "@/components/modals/clerk/task/UpdateTaskStatus";

export default function TasksPage() {
    /* ---------------- STATES ---------------- */

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [editStatus, setEditStatus] = useState(false);

    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    /* ---------------- API URL ---------------- */

    const API_URL =
       process.env.NEXT_PUBLIC_API_URL || "https://legacycare-backend.onrender.com/api";

    /* ---------------- LOAD TASKS ---------------- */

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("authToken");

            if (!token) {
                setError("You are not logged in.");
                return;
            }

            const response = await fetch(`${API_URL}/Task`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Task Response Status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();

                console.error("Task API error:", errorText);

                if (response.status === 401) {
                    setError("Your session has expired. Please log in again.");
                } else if (response.status === 403) {
                    setError(
                        "You do not have permission to view these tasks."
                    );
                } else {
                    setError("Failed to load tasks.");
                }

                return;
            }

            const data = await response.json();

            console.log("Tasks received:", data);
            console.log("Number of tasks:", data.length);

            setTasks(data);

            // If the currently selected task exists,
            // update it with the latest information.
            if (selectedTaskId) {
                const updatedSelectedTask = data.find(
                    (task: any) => task.taskId === selectedTaskId
                );

                if (updatedSelectedTask) {
                    setSelectedTask(updatedSelectedTask);
                }
            }
        } catch (error) {
            console.error("Load tasks error:", error);
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- LOAD TASKS WHEN PAGE OPENS ---------------- */

    useEffect(() => {
        loadTasks();
    }, []);

    /* ---------------- SELECT TASK ---------------- */

    const handleViewTask = (task: any) => {
        setSelectedTask(task);
        setSelectedTaskId(task.taskId);
        setEditStatus(false);
    };

    /* ---------------- EDIT STATUS ---------------- */

    const handleEditStatus = () => {
        if (!selectedTask) {
            alert("Please select a task first.");
            return;
        }

        setEditStatus(true);
    };

    /* ---------------- UPDATE STATUS ---------------- */

    const handleSaveStatus = async (
        taskId: string,
        status: number
    ): Promise<void> => {
        try {
            const token = localStorage.getItem("authToken");

            if (!token) {
                alert("You are not logged in.");
                return;
            }

            const response = await fetch(
                `${API_URL}/Task/${taskId}/status?status=${status}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "Update Task Status Response:",
                response.status
            );

            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "Update task status error:",
                    errorText
                );

                if (response.status === 401) {
                    alert(
                        "Your session has expired. Please log in again."
                    );
                } else if (response.status === 403) {
                    alert(
                        "You do not have permission to update this task."
                    );
                } else {
                    alert(
                        errorText ||
                            "Failed to update task status."
                    );
                }

                return;
            }

            /*
             * These numbers match your backend enum:
             *
             * 0 = NotStarted
             * 1 = Completed
             * 2 = InProgress
             */

            const statusMap: Record<number, string> = {
                0: "Not Started",
                1: "In Progress",
                2: "Completed",
                
            };

            const statusText =
                statusMap[status] ?? "Not Started";

            /* ---------------- UPDATE TABLE ---------------- */

            setTasks((previousTasks) =>
                previousTasks.map((task) =>
                    task.taskId === taskId
                        ? {
                              ...task,
                              status: statusText,
                          }
                        : task
                )
            );

            /* ---------------- UPDATE SELECTED TASK ---------------- */

            setSelectedTask((previousTask: any) =>
                previousTask?.taskId === taskId
                    ? {
                          ...previousTask,
                          status: statusText,
                      }
                    : previousTask
            );

            /* ---------------- CLOSE EDIT MODE ---------------- */

            setEditStatus(false);

            alert("Task status updated successfully.");

            /*
             * Load the tasks again so the frontend
             * is guaranteed to match the database.
             */
            await loadTasks();
        } catch (error) {
            console.error(
                "Update task status error:",
                error
            );

            alert(
                "Unable to update task status. Please try again."
            );
        }
    };

    /* ---------------- METRICS ---------------- */

    const totalTasks = tasks.length;

    const pendingTasks = tasks.filter(
        (task) =>
            task.status === "Not Started" ||
            task.status === "Pending"
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "Completed"
    ).length;

    const overdueTasks = tasks.filter((task) => {
        if (!task.dueDate) {
            return false;
        }

        if (
            task.status === "Completed"
        ) {
            return false;
        }

        const dueDate = new Date(task.dueDate);
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        return dueDate < today;
    }).length;

    /* ---------------- TABLE COLUMNS ---------------- */

    const columns = [
        {
            key: "task",
            label: "Task",

            render: (row: any) => (
                <div className="flex items-center gap-3">
                    <div>
                        <div className="font-medium text-gray-900">
                            {row.title || "Untitled Task"}
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

            render: (row: any) => {
                if (!row.dueDate) {
                    return "N/A";
                }

                return new Date(
                    row.dueDate
                ).toLocaleDateString();
            },
        },

        {
            key: "status",
            label: "Status",

            render: (row: any) => (
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        row.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : row.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                    {row.status}
                </span>
            ),
        },
    ];

    /* ---------------- PAGE ---------------- */

    return (
        <div className="space-y-6">
            {/* PAGE HEADER */}

            <PageBreadcrumb pageTitle="Manage Tasks" />

            {/* METRIC CARDS */}

            <TaskMetricCard
                totTask={totalTasks}
                pendingTask={pendingTasks}
                completedTask={completedTasks}
                overdueTask={overdueTasks}
            />

            {/* TABLE + DETAILS PANEL */}

            <div className="grid grid-cols-12 gap-6">
                {/* TABLE */}

                <div className="col-span-8">
                    <ComponentCard title="Tasks">
                        <div className="mb-4 flex w-full items-center justify-between">
                            <Link
                                href="/admin/tasks"
                                className="text-sm font-medium text-teal-600"
                            >
                                View All
                            </Link>

                            <button
                                type="button"
                                onClick={loadTasks}
                                className="text-sm font-medium text-teal-600 hover:text-teal-800"
                            >
                                Refresh
                            </button>
                        </div>

                        {/* ERROR */}

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* LOADING */}

                        {loading ? (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">
                                    Loading tasks...
                                </p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">
                                    No tasks found.
                                </p>
                            </div>
                        ) : (
                            <ReusableTable
                                columns={columns}
                                data={tasks}
                                onRowClick={handleViewTask}
                                onEdit={(task: any) => {
                                    setSelectedTask(task);
                                    setSelectedTaskId(
                                        task.taskId
                                    );
                                    setEditStatus(true);
                                }}
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
                                    task={selectedTask}
                                    onCancel={() =>
                                        setEditStatus(false)
                                    }
                                    onSave={handleSaveStatus}
                                />
                            ) : (
                                <TaskDetails
                                    task={selectedTask}
                                    
                                    
                                />
                            )
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">
                                    Select a task to view details
                                </p>
                            </div>
                        )}
                    </ComponentCard>
                </div>
            </div>
        </div>
    );
}