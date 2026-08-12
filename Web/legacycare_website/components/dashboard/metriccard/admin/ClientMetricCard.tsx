"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { GroupIcon } from "@/icons";

interface ClientMetricCardProp {
    totClients: number
    activeClients: number
    inactiveClients: number
}

export default function ClientMetricCard({
    totClients,
    activeClients,
    inactiveClients,
}: ClientMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                title="Total Clients"
                value={totClients}
                description="All Registered Clients"
                icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
            <MetricCard
                title="Active Clients"
                value={activeClients}
                description="Currently Active"
                icon={<GroupIcon className="size-6 text-purple-800 dark:text-white" />}
                iconBgColor="bg-purple-100"
                change="+8%"
                changeType="success"
            />
            <MetricCard
                title="Inactive Clients"
                value={inactiveClients}
                description="Not Active"
                icon={<GroupIcon className="size-6 text-teal-800 dark:text-white" />}
                iconBgColor="bg-teal-100"
                change="-5%"
                changeType="error"
            />
        </div>
    );
}