"use client";

import { PencilIcon, LockIcon } from "@/icons";

interface SecurityProps {
    onChangePassword?: () => void;
}

export default function ({
    onChangePassword
}: SecurityProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            {/*Heading */}
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
                Security
            </h2>

            {/*Password */}
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-6">
                <div className="flex items-center gap-5">
                    {/*Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <LockIcon />
                    </div>

                    {/*Password Info */}
                    <div className="w-20">
                        <p className="text-sm text-gray-500">
                            Password
                        </p>

                        <p className="text-sm text-gray-500">
                            •••••••••••
                        </p>
                    </div>
                </div>

                {/*Change Passwword */}
                <button
                    onClick={onChangePassword}
                    className="flex items-center justify-center gap-1 whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                    <PencilIcon />
                    Change Password
                </button>
            </div>
        </div>
    )
}