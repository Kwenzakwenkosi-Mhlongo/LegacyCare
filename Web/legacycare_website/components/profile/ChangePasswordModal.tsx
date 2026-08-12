"use client";
import { useState, } from "react";

interface Props {
    onClose: () => void;
    onSubmit: (
        currentPassword: string,
        newPassword: string
    ) => Promise<void>;
}

    export default function ChangePasswordModal({
        onClose,
        onSubmit,
    }: Props) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error,setError] = useState("");

    const handleSubmit= async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");

    if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.")
        return;
    }
    if(newPassword !== confirmPassword) {
        setError("New password and confirmation password do not match.");
        return;
    }

        try {
            setLoading(true);

            await onSubmit(currentPassword, newPassword);

            alert("Password successfully changed.");
            onClose();

        } catch (error) {
            alert(error instanceof Error
                ? error.message
                : "Failed to change password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg w-96 p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Change Password
                </h2>

                <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border p-2 mb-3"
                    required
                />

                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border p-2 mb-4"
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border p-2 mb-4"
                    required
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded border px-4 py-2"
                    >
                        Cancel
                    </button>

                    {error && (
                        <p className="mb-2 text-red-500">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded bg-teal-600 px-4 py-2 text-white"
                    >
                        {loading
                            ? "Saving..."
                            : "Change Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}