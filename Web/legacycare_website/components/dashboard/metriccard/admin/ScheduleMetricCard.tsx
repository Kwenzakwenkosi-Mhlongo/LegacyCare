"use client";

import MetricCard from "@/components/dashboard/metriccard/admin/MetricCard";
import { BuildingIcon, CalenderIcon, CoffinIcon, FlagIcon, UserIcon } from "@/icons";

interface EventMetricCardProp {
    totEvent: number
    totFuneral: number
    totMemorial: number
    totAppointments: number
    totParlour: number
}

export default function EventMetricCard({
    totEvent,
    totFuneral,
    totMemorial,
    totAppointments,
    totParlour,
}: EventMetricCardProp) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Upcoming Events"
                        value={totEvent}
                        description="All Created Events"
                        icon={<CalenderIcon className="size-6 text-sky-800 dark:text-white" />}
                        iconBgColor="bg-sky-100"
                        changeType="success"
                    />
                    <MetricCard
                        title="Total Funerals"
                        value={totFuneral}
                        description="All Upcoming Funerals"
                        icon={<CoffinIcon className="size-6 text-purple-800 dark:text-white" />}
                        iconBgColor="bg-purple-100"
                        change="-5%"
                        changeType="error"
                    />
                    <MetricCard
                        title="Total Memorials"
                        value={totMemorial}
                        description="All Upcoming Memorials"
                        icon={<FlagIcon className="size-6 text-teal-800 dark:text-white" />}
                        iconBgColor="bg-teal-100"
                        change="-5%"
                        changeType="error"
                    />
                    <MetricCard
                        title="Total Appointments"
                        value={totAppointments}
                        description="All Upcoming Appointments"
                        icon={<UserIcon className="size-6 text-blue-800 dark:text-white" />}
                        iconBgColor="bg-blue-100"
                        change="+8%"
                        changeType="success"
                    />
                    <MetricCard
                        title="Total Parlour-Related Events"
                        value={totParlour}
                        description="All Upcoming Parlour Event"
                        icon={<BuildingIcon className="size-6 text-indigo-800 dark:text-white" />}
                        iconBgColor="bg-indigo-100"
                        change="-5%"
                        changeType="error"
                    />
                </div>
    )
}