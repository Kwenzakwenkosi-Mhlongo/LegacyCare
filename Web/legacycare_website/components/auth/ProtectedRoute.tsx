"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuth } from "@/lib/auth";



export default function ProtectedRoute({
    children,
} : {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const auth = getAuth();

        //not logged in
        if (!auth) {
            router.replace("/");
            return;
        }

        const userRole = auth.role.toLowerCase();

        const roleRoutes = {
            admin: "/admin",
            staff: "/staff",
            clerk: "/clerk",
            client: "/client",
        }

        //determine which role is being accessed
        const requestedRole =
        pathname.startsWith("/admin") ? "admin"
        : pathname.startsWith("/staff") ? "staff"
        : pathname.startsWith("/clerk") ? "clerk"
        : pathname.startsWith("/client") ? "client"
        : null;

        //if user is trying to access another's role
        if (requestedRole && requestedRole != userRole) {
            router.replace(
                roleRoutes[userRole as keyof typeof roleRoutes]
            );
            return;
        }
        setAuthorized(true);
    }, [pathname, router]);

    if (!authorized) {
        return(
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }
    return <>{children}</>;
}