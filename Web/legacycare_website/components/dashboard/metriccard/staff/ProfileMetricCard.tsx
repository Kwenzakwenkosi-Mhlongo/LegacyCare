"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { CheckLineIcon, ProgressIcon } from "@/icons";

interface ProfileMetricCardProp {
    totTasks: number
    pendingTasks: number
    
}

export default function ProfileMetricCard({
    totTasks,
    pendingTasks,
}: ProfileMetricCardProp) {
    return (
        <div className="flex items-center gap-2">
            <MetricCard
                title="Total Number of Tasks"
                value={totTasks}
                description="Assigned To You"
                icon={<CheckLineIcon className="h-4 w-4 size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
            <MetricCard
                title="Pending Tasks "
                value={pendingTasks}
                description="To Be Completed"
                icon={<ProgressIcon className="size-6 text-purple-800 dark:text-white" />}
                iconBgColor="bg-purple-100"
                changeType="success"
            />
        </div>
    )
}



