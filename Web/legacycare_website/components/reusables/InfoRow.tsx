"use client";
import { ReactNode } from "react";

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export default function InfoRow({
  icon,
  label,
  value
}: InfoRowProps) {

  return (

    <div className="flex items-center gap-3">


      <div className="flex h-6 w-6 shrink-0 items-center justify-center opacity-60">
        {icon}
      </div>

      <div className="w-28 text-sm text-gray-500">
        {label}
      </div>

      <div className="flex-1 whitespace-pre-line text-sm text-gray-800">
        {value}
      </div>
    </div>
  );
}