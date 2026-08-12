"use client";

interface LogoutConfirmationProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function LogoutConfirmation({
    isOpen,
    onConfirm,
    onCancel,
}: LogoutConfirmationProps) {

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-xl font-bold mt-4">Confirm Logout</h2>
                    <p className="text-gray-500 mt-3">Are you sure you want to log out?</p>
                    <div className="flex gap-4 w-full mt-8">
                        <button onClick={onCancel}
                            className="flex-1 border border-gray-300 p-3 rounded-xl hover:bg-gray-100">
                            Cancel
                        </button>

                        <button onClick={onConfirm}
                            className="flex-1 bg-teal-600 text-white p-3 rounded-xl hover:bg-red-700">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}