"use client";

import InfoRow from "../reusables/InfoRow";
import { UserIcon, CheckLineIcon, CalenderIcon, TimeIcon, BriefCaseIcon } from "@/icons";

interface AccountInformationProps {
    role: string;
    status: string;
    createdDate: string;
    lastLogin: string;
}

export default function AccountInformation({
    role,
    status,
    createdDate,
    lastLogin
}: AccountInformationProps) {
    return (

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/*Heading */}
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Account Information</h2>

            {/*Information */}
            <div className="space-y-5">

                <InfoRow
                    icon={<BriefCaseIcon />}
                    label="Role"
                    value={
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                            {role}
                        </span>
                        }
                />

                <InfoRow
                    icon={<CheckLineIcon />}
                    label="Account Status"
                    value={
                        <span className={
                            `rounded-full px-3 py-1 text-xs font-medium
                            ${status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`
                                }
                                >
                            {status}
                        </span>
                        }
                />

                <InfoRow
                    icon={<CalenderIcon />}
                    label="Date joined"
                    value={createdDate}
                />

                <InfoRow
                    icon={<TimeIcon />}
                    label="Last Login"
                    value={lastLogin}
                />
            </div>
        </div>
    );
}