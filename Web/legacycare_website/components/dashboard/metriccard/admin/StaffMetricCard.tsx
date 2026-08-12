"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { GroupIcon } from "@/icons";

interface StaffMetricCardProp {
    totStaff: number
    activeStaff: number
    inactiveStaff: number
}

export default function StaffMetricCard({
    totStaff,
    activeStaff,
    inactiveStaff,
}: StaffMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Staff"
                        value={totStaff}
                        description="All Registered Staff Members"
                        icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                        iconBgColor="bg-sky-100"
                        change="+8%"
                        changeType="success"
                    />
                    <MetricCard
                        title="Active Staff"
                        value={activeStaff}
                        description="Currently Active"
                        icon={<GroupIcon className="size-6 text-purple-800 dark:text-white" />}
                        iconBgColor="bg-purple-100"
                        change="+8%"
                        changeType="success"
                    />
                    <MetricCard
                        title="Inactive Staff"
                        value={inactiveStaff}
                        description="Not Active"
                        icon={<GroupIcon className="size-6 text-teal-800 dark:text-white" />}
                        iconBgColor="bg-teal-100"
                        change="-5%"
                        changeType="error"
                    />
                </div>
    )
}