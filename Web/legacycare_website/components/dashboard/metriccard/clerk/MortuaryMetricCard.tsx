"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { GroupIcon } from "@/icons";

interface MortuaryMetricCardProp {
    totStorage: number;
    totAvailable: number;
    totUnavailable: number
    
}

export default function MortuaryMetricCard({
    totStorage,
    totAvailable,
    totUnavailable
}: MortuaryMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                title="Total Units"
                value={totStorage}
                description="All units in the branch storage"
                icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
            <MetricCard
                title="Available Units"
                value={totAvailable}
                description="All available units in the branch storage"
                icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
            <MetricCard
                title="Unavailable Units"
                value={totUnavailable}
                description="All occupied units in the branch storage"
                icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
        </div>
    );
}