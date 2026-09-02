// File:
// Web/legacycare_website/app/(dashboard)/client/reports/page.tsx

"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Receipt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type ReportCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  action: string;
};

export default function ClientReportsPage() {
  useEffect(() => {
    document.title = "Reports | LegacyCare";
  }, []);

  const reports: ReportCard[] = [
    {
      title: "Payment Statement",
      description:
        "Download a combined statement containing successful, pending and overdue premium records.",
      href: "/client/reports/payments",
      icon: FileText,
      action: "View Payment Statement",
    },
    {
      title: "Payment Receipts",
      description:
        "View successful premium payments and download individual payment receipts.",
      href: "/client/payments",
      icon: Receipt,
      action: "View Payment Receipts",
    },
    {
      title: "Policy Summary",
      description:
        "Download important policy information including package, premium, status and policy dates.",
      href: "/client/reports/policies",
      icon: ShieldCheck,
      action: "View Policy Report",
    },
    {
      title: "Beneficiary Report",
      description:
        "View and download beneficiaries linked to your LegacyCare policies.",
      href: "/client/reports/beneficiaries",
      icon: Users,
      action: "View Beneficiary Report",
    },
    {
      title: "Service Request History",
      description:
        "Download your appointments, enquiries, document requests and other service-request history.",
      href: "/client/reports/service-requests",
      icon: ClipboardList,
      action: "View Request History",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-600 p-8 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          LegacyCare Client Portal
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Reports
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50">
          View and download your important payment, policy,
          beneficiary and service information.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Reports
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select a report to view its records and download a PDF copy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-2">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <article
                key={report.title}
                className="rounded-2xl border border-gray-200 p-5 transition hover:border-teal-300 hover:shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <Icon
                      className="h-6 w-6"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {report.title}
                      </h3>

                      <CheckCircle2
                        className="h-4 w-4 text-green-600"
                        strokeWidth={2.2}
                        aria-label="Available"
                      />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {report.description}
                    </p>

                    <Link
                      href={report.href}
                      className="mt-5 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700"
                    >
                      {report.action}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}