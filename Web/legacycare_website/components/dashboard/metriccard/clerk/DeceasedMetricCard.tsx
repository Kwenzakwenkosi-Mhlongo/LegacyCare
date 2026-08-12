"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { GroupIcon } from "@/icons";

interface DeceasedMetricCardProp {
    totDeceased: number
}

export default function DeceasedMetricCard({
    totDeceased,
}: DeceasedMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                title="Total Deceased"
                value={totDeceased}
                description="All Deceased in the branch storage"
                icon={<GroupIcon className="size-6 text-sky-800 dark:text-white" />}
                iconBgColor="bg-sky-100"
                changeType="success"
            />
        </div>
    );
}