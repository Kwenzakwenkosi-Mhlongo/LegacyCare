"use client";
import { UserIcon, EnvelopeIcon, PhoneIcon, CalenderIcon } from "@/icons";

interface HeaderProps {
    fullName: string;
    role: string;
    email: string;
    phone: string;
    joined: string;
}

export default function Header({
    fullName, role, email, phone, joined,
}: HeaderProps) {
    const initials = fullName
        .split("")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="w-90 rounded-xl border border-gray-200 bg-white shadow-sm p-6">

            <div className="flex justify-center gap-4">
                {/*Initials */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-semibold text-xl">
                    {initials}
                </div>

                {/*Name + Role + Contact Details */}
                <div className="flex-1">
                    {/*Name + Role */}
                    <div className="flex items-center gap-3">
                        {/*Name */}
                        <h2 className="text-lg font-semibold text-gray-800">
                            {fullName}
                        </h2>
                        {/*Role */}
                        <span className="rounded-full bg-sky-100 px-4 py-1 text-sm font-medium text-sky-700">
                            {role}
                        </span>
                    </div>

                    {/*Contact Details */}
                    {/*Email */}
                    <div className="flex items-center text-gray-600">
                        <span className="text-sm">{email}</span>
                    </div>
                    {/*Phone */}
                    <div className="flex items-center text-gray-600">
                        <span className="text-sm">{phone}</span>
                    </div>
                    {/*Date Joined */}
                    <div className="flex items-center text-gray-600">
                        <span className="text-sm">Date Joined: {joined}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}