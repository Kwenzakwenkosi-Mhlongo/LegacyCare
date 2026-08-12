"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!token) {
            setError("Invalid or missing password setup token.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const apiUrl =
                process.env.NEXT_PUBLIC_API_URL ||
                "https://legacycare-backend.onrender.com";

            const response = await fetch(
                `${apiUrl}/api/Authentication/set-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: token,
                        newPassword: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to set password."
                );
            }

            setMessage(
                "Password created successfully. You can now log in."
            );

            setTimeout(() => {
                router.push("/login");
            }, 2000);

        } catch (err: any) {
            setError(
                err.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: "400px",
                margin: "80px auto",
                padding: "30px",
            }}
        >
            <h1>Set Your Password</h1>

            <p>
                Create a password for your LegacyCare account.
            </p>

            <form onSubmit={handleSubmit}>

                <div style={{ marginBottom: "15px" }}>
                    <label>New Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>Confirm Password</label>

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                        placeholder="Confirm password"
                        required
                        minLength={8}
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                        }}
                    />
                </div>

                {error && (
                    <p style={{ color: "red" }}>
                        {error}
                    </p>
                )}

                {message && (
                    <p style={{ color: "green" }}>
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                    }}
                >
                    {loading
                        ? "Setting Password..."
                        : "Set Password"}
                </button>

            </form>
        </div>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SetPasswordForm />
        </Suspense>
    );
}
