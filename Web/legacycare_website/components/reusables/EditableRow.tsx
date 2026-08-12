interface EditableRowProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}

export default function EditableRow({
    icon,
    label,
    children,
}: EditableRowProps) {
    return (
        <div className="space-y-2">
            {/* Label */}
            <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center opacity-60">
                    {icon}
                </div>

                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            </div>

            {/* Input */}
            <div>
                {children}
            </div>
        </div>
    );
}