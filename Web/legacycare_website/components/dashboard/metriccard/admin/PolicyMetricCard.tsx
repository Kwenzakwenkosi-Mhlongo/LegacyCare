"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { FileIcon } from "@/icons";

interface PolicyMetricCardProp {
    totPolicy: number
    activePolicy: number
    inactivePolicy: number
}

export default function PolicyMetricCard({
    totPolicy,
    activePolicy,
    inactivePolicy,
}: PolicyMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Policies"
                        value={totPolicy}
                        description="All Created Policies"
                        icon={<FileIcon className="size-6 text-blue-800 dark:text-white" />}
                        iconBgColor="bg-blue-100"
                        changeType="success"
                    />
                    <MetricCard
                        title="Active Policies"
                        value={activePolicy}
                        description="Currently Active"
                        icon={<FileIcon className="size-6 text-purple-800 dark:text-white" />}
                        iconBgColor="bg-purple-100"
                        change="+8%"
                        changeType="success"
                    />
                    <MetricCard
                        title="Inactive Policies"
                        value={inactivePolicy}
                        description="Not Active"
                        icon={<FileIcon className="size-6 text-teal-800 dark:text-white" />}
                        iconBgColor="bg-teal-100"
                        change="-5%"
                        changeType="error"
                    />
                </div>
    )
}