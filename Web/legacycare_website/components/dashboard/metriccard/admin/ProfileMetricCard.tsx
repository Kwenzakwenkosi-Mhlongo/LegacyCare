"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { BriefCaseIcon, CalenderIcon, FileIcon, GroupIcon } from "@/icons";

interface ProfileMetricCardProp {
    totClients: number
    totStaff: number
    totEvents: number
    totTasks: number
}

export default function ProfileMetricCard({
    totClients,
    totStaff,
    totEvents,
    totTasks
}: ProfileMetricCardProp) {
    return (
        <div className="flex items-center gap-2">
            <MetricCard
                title="Total Clients"
                value={totClients}
                description="All Registered Clients"
                icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
            <MetricCard
                title="Total Staff"
                value={totStaff}
                description="All Registered Staff"
                icon={<BriefCaseIcon className="size-6 text-purple-800 dark:text-white" />}
                iconBgColor="bg-purple-100"
                changeType="success"
            />
            <MetricCard
                title="Total Events"
                value={totEvents}
                description="All Upcoming Events"
                icon={<CalenderIcon className="size-6 text-teal-800 dark:text-white" />}
                iconBgColor="bg-teal-100"
                changeType="success"
            />

            <MetricCard
                title="Total Tasks"
                value={totTasks}
                description="To Be Completed"
                icon={<FileIcon className="size-6 text-blue-800 dark:text-white" />}
                iconBgColor="bg-blue-100"
                changeType="success"
            />

        </div>
    )
}



