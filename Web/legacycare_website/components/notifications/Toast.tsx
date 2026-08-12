"use client";

import { InfoIcon } from "@/icons";

interface ToastProps {
    title: string;
    message: string;
    type: "success" | "warning" | "error" | "info";
}

export default function Toast({
    title,
    message,
    type,
} : ToastProps) {
    const styles = {
        success: {
            border: "border-green-200",
            bg: "bg-green-50",
            text: "text-green-700",
            icon: <InfoIcon className="h-5 w-5" />
        },
        info: {
            border: "border-blue-200",
            bg: "bg-blue-50",
            text: "text-blue-700",
            icon: <InfoIcon className="h-5 w-5" />
        },
        warning: {
            border: "border-yellow-200",
            bg: "bg-yellow-50",
            text: "text-yellow-700",
            icon: <InfoIcon className="h-5 w-5" />
        },
        error: {
            border: "border-red-200",
            bg: "bg-red-50",
            text: "text-red-700",
            icon: <InfoIcon className="h-5 w-5" />
        },
    };

    const style = styles[type];

    return (
        <div className={`w-96 rounded-xl border
            ${style.border}
            ${style.bg}
            shadow-xl animate-in slide-in-from-right
            fade-in duration-300
            `}
            >
                <div className="flex items-start gap-3 p-4">
                    <div className={style.text}>
                        {style.icon}
                    </div>

                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                            {title}
                        </h4>

                        <p className="mt-1 text-sm text-gray-600">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
    );
}