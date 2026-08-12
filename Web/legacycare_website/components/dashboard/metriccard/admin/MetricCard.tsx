import React from "react";

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  change?: string;
  changeType?: "success" | "error";
};

export default function MetricCard({
  title,
  value,
  description,
  icon,
  iconBgColor = "bg-gray-100",
  change,
  changeType = "success",
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        {/* Left Side */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBgColor}`}>
            {icon}
          </div>

          {/* Title & Value */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>

            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
          </div>
        </div>

        {/* Change */}
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              changeType === "success"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            <span>{changeType === "success" ? "↗" : "↗"}</span>
            <span>{change}</span>
          </div>
        )}
      </div>

      {/* Bottom Text */}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}