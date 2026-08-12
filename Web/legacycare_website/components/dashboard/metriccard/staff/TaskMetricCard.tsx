"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { BoxIconLine, CheckCircleIcon, FolderIcon, GroupIcon, ProgressIcon } from "@/icons";

interface TaskMetricCardProp {
    totTask: number
    pendingTask: number
    completedTask: number
    overdueTask: number
}

export default function TaskMetricCard({
    totTask,
    pendingTask,
    completedTask,
    overdueTask
}: TaskMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Task"
                        value={totTask}
                        description="All Registered Task Members"
                        icon={<FolderIcon className="size-6 text-sky-800 dark:text-white" />}
                        iconBgColor="bg-sky-100"
                        change="+8%"
                        changeType="success"
                    />
                    <MetricCard
                        title="Pending Tasks"
                        value={pendingTask}
                        description="Currently Active"
                        icon={<ProgressIcon className="size-6 text-purple-800 dark:text-white" />}
                        iconBgColor="bg-purple-100"
                        change="+8%"
                        changeType="success"
                    />
                    <MetricCard
                        title="Completed Tasks"
                        value={completedTask}
                        description="Not Active"
                        icon={<CheckCircleIcon className="size-6 text-teal-800 dark:text-white" />}
                        iconBgColor="bg-teal-100"
                        change="-5%"
                        changeType="error"
                    />
                    <MetricCard
                        title="Overdue Tasks"
                        value={overdueTask}
                        description="Not Active"
                        icon={<BoxIconLine className="size-6 text-blue-800 dark:text-white" />}
                        iconBgColor="bg-blue-100"
                        change="-5%"
                        changeType="error"
                    />
                </div>
    )
}