"use client";

import { getDashboardData } from "@/lib/dashboardService";
import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface RevenueData {
  month: string;
  amount: number;
}

interface StaffRoleData {
  role: string;
  count: number;
}

interface TaskStatusData {
  status: string;
  count: number;
}

interface PolicyStatusData {
  totalPolicies: number;
  activePolicies: number;
  inactivePolicies: number;
  pending: number;
  expired: number;
  cancelled: number;
}

interface MortuaryData {
  totalStorage: number;
  occupied: number;
  available: number;
}

interface RecentActivityData {
  activity: string;
  date: string;
}

interface DashboardData {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;

  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;

  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;

  totalRevenue: number;
  totalLoss: number;

  revenue: RevenueData[];

  policyStatus: PolicyStatusData;

  staffByRole: StaffRoleData[];

  taskStatus: TaskStatusData[];

  mortuary: MortuaryData;

  recentActivity: RecentActivityData[];
}

const POLICY_COLORS = [
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#ef4444",
  "#6b7280",
];

const STATUS_COLORS = [
  "#22c55e",
  "#ef4444",
];

export default function AdminPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardData();

        console.log("Dashboard data:", data);

        setDashboard(data);
      } catch (err) {
        console.error("Dashboard error:", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">
            Dashboard Error
          </p>

          <p className="mt-2">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        No dashboard data available.
      </div>
    );
  }

  // ==============================
  // POLICY CHART
  // ==============================

  const policyChartData = [
    {
      name: "Active",
      value: dashboard.policyStatus.activePolicies,
    },
    {
      name: "Inactive",
      value: dashboard.policyStatus.inactivePolicies,
    },
    {
      name: "Pending",
      value: dashboard.policyStatus.pending,
    },
    {
      name: "Expired",
      value: dashboard.policyStatus.expired,
    },
    {
      name: "Cancelled",
      value: dashboard.policyStatus.cancelled,
    },
  ];

  // ==============================
  // CLIENT STATUS CHART
  // ==============================

  const clientChartData = [
    {
      name: "Active",
      value: dashboard.activeClients,
    },
    {
      name: "Inactive",
      value: dashboard.inactiveClients,
    },
  ];

  // ==============================
  // STAFF STATUS CHART
  // ==============================

  const staffChartData = [
    {
      name: "Active",
      value: dashboard.activeStaff,
    },
    {
      name: "Inactive",
      value: dashboard.inactiveStaff,
    },
  ];

  // ==============================
  // BRANCH STATUS CHART
  // ==============================

  const branchChartData = [
    {
      name: "Active",
      value: dashboard.activeBranches,
    },
    {
      name: "Inactive",
      value: dashboard.inactiveBranches,
    },
  ];

  // ==============================
  // MORTUARY CHART
  // ==============================

  const mortuaryChartData = [
    {
      name: "Occupied",
      value: dashboard.mortuary.occupied,
    },
    {
      name: "Available",
      value: dashboard.mortuary.available,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ==============================
          HEADER
      ============================== */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <p className="mt-1 text-gray-600">
          Overview of LegacyCare system activity
        </p>
      </div>

      {/* ==============================
          SUMMARY CARDS
      ============================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">

        {/* CLIENTS */}

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Clients
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dashboard.totalClients}
          </p>

          <div className="mt-3 text-sm">
            <p className="text-green-600">
              Active: {dashboard.activeClients}
            </p>

            <p className="text-red-600">
              Inactive: {dashboard.inactiveClients}
            </p>
          </div>
        </div>

        {/* STAFF */}

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Staff
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dashboard.totalStaff}
          </p>

          <div className="mt-3 text-sm">
            <p className="text-green-600">
              Active: {dashboard.activeStaff}
            </p>

            <p className="text-red-600">
              Inactive: {dashboard.inactiveStaff}
            </p>
          </div>
        </div>

        {/* BRANCHES */}

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Branches
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dashboard.totalBranches}
          </p>

          <div className="mt-3 text-sm">
            <p className="text-green-600">
              Active: {dashboard.activeBranches}
            </p>

            <p className="text-red-600">
              Inactive: {dashboard.inactiveBranches}
            </p>
          </div>
        </div>

        {/* POLICIES */}

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Policies
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dashboard.policyStatus.totalPolicies}
          </p>

          <div className="mt-3 text-sm">
            <p className="text-green-600">
              Active: {dashboard.policyStatus.activePolicies}
            </p>

            <p className="text-red-600">
              Inactive: {dashboard.policyStatus.inactivePolicies}
            </p>
          </div>
        </div>

        {/* REVENUE */}

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Revenue
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            R{dashboard.totalRevenue.toLocaleString()}
          </p>

          <p className="mt-3 text-sm text-red-600">
            Loss: R{dashboard.totalLoss.toLocaleString()}
          </p>
        </div>

      </div>

      {/* ==============================
          CLIENT / STAFF / BRANCH STATUS
      ============================== */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* CLIENT STATUS */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Client Status
          </h2>

          <div className="h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={clientChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {clientChartData.map(
                    (entry, index) => (
                      <Cell
                        key={`client-${index}`}
                        fill={
                          STATUS_COLORS[index]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* STAFF STATUS */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Staff Status
          </h2>

          <div className="h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={staffChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {staffChartData.map(
                    (entry, index) => (
                      <Cell
                        key={`staff-${index}`}
                        fill={
                          STATUS_COLORS[index]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* BRANCH STATUS */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Branch Status
          </h2>

          <div className="h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={branchChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {branchChartData.map(
                    (entry, index) => (
                      <Cell
                        key={`branch-${index}`}
                        fill={
                          STATUS_COLORS[index]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* ==============================
          POLICY STATUS + MORTUARY
      ============================== */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* POLICY STATUS */}

        <div className="rounded-xl bg-white p-6 shadow">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold text-gray-900">
              Policy Status
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
              Total:{" "}
              {dashboard.policyStatus.totalPolicies}
            </span>

          </div>

          <div className="h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={policyChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label
                >
                  {policyChartData.map(
                    (entry, index) => (
                      <Cell
                        key={`policy-${index}`}
                        fill={
                          POLICY_COLORS[index]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">

            <div>
              <span className="text-gray-500">
                Active:
              </span>{" "}
              <strong>
                {dashboard.policyStatus.activePolicies}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">
                Inactive:
              </span>{" "}
              <strong>
                {dashboard.policyStatus.inactivePolicies}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">
                Pending:
              </span>{" "}
              <strong>
                {dashboard.policyStatus.pending}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">
                Expired:
              </span>{" "}
              <strong>
                {dashboard.policyStatus.expired}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">
                Cancelled:
              </span>{" "}
              <strong>
                {dashboard.policyStatus.cancelled}
              </strong>
            </div>

          </div>

        </div>

        {/* MORTUARY */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Mortuary Storage
          </h2>

          <div className="grid grid-cols-3 gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Total
              </p>

              <p className="text-3xl font-bold">
                {dashboard.mortuary.totalStorage}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Occupied
              </p>

              <p className="text-3xl font-bold">
                {dashboard.mortuary.occupied}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Available
              </p>

              <p className="text-3xl font-bold">
                {dashboard.mortuary.available}
              </p>
            </div>

          </div>

          <div className="mt-6 h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={mortuaryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {mortuaryChartData.map(
                    (entry, index) => (
                      <Cell
                        key={`mortuary-${index}`}
                        fill={
                          index === 0
                            ? "#f97316"
                            : "#22c55e"
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* ==============================
          REVENUE
      ============================== */}

      <div className="mt-6 rounded-xl bg-white p-6 shadow">

        <div className="flex items-center justify-between">

          <h2 className="text-xl font-semibold text-gray-900">
            Revenue
          </h2>

          <div className="text-right">

            <p className="text-sm text-gray-500">
              Total Revenue
            </p>

            <p className="text-xl font-bold text-green-600">
              R{dashboard.totalRevenue.toLocaleString()}
            </p>

          </div>

        </div>

        <div className="mt-5 h-[350px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart data={dashboard.revenue}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  `R${Number(value).toLocaleString()}`,
                  "Revenue",
                ]}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="amount"
                name="Revenue"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* ==============================
          STAFF BY ROLE + TASK STATUS
      ============================== */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* STAFF BY ROLE */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Staff By Role
          </h2>

          <div className="h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={dashboard.staffByRole}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="role"
                  angle={-25}
                  textAnchor="end"
                  height={80}
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="count"
                  name="Staff"
                  fill="#3b82f6"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* TASK STATUS */}

        <div className="rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Task Status
          </h2>

          <div className="h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={dashboard.taskStatus}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="status" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="count"
                  name="Tasks"
                  fill="#8b5cf6"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* ==============================
          RECENT ACTIVITY
      ============================== */}

      <div className="mt-6 rounded-xl bg-white p-6 shadow">

        <h2 className="mb-5 text-xl font-semibold text-gray-900">
          Recent Activity
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b text-left">

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Activity
                </th>

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Date
                </th>

              </tr>

            </thead>

            <tbody>

              {dashboard.recentActivity.length === 0 ? (

                <tr>

                  <td
                    colSpan={2}
                    className="py-6 text-center text-gray-500"
                  >
                    No recent activity.
                  </td>

                </tr>

              ) : (

                dashboard.recentActivity.map(
                  (activity, index) => (

                    <tr
                      key={`${activity.activity}-${activity.date}-${index}`}
                      className="border-b last:border-0"
                    >

                      <td className="py-3 text-gray-800">
                        {activity.activity}
                      </td>

                      <td className="py-3 text-gray-500">
                        {activity.date}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}