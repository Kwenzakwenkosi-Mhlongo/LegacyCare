import { apiFetch } from "./api";

const API_URL = "http://localhost:5224/api/staff";

export async function getStaffs() {
    const response = await apiFetch(API_URL);

    if (!response.ok){
        throw new Error("Failed to fetch staff");
    }
    return response.json();
}

export async function getStaff(staffId: string) {
    const response = await apiFetch(`${API_URL}/${staffId}`);

    if (!response.ok){
        throw new Error("Failed to fetch staff info");
    }
    return response.json();
}

export async function createStaff(staff: any) {
    const response = await apiFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(staff),
    });

    if (!response.ok){
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    return response.json();
}

export async function updateStaff(staffId: string, staff: {
    fullName: string;
    idNumber: string;
    email: string;
    cellNo: string;
    address: string;
    isActive: boolean;
    role: string;
    salary: number;
    branchId: string
}) {
    const response = await apiFetch(`${API_URL}/${staffId}`, {
        method: "PUT",
        body: JSON.stringify(staff),
    });

    if (!response.ok){
        const errorText = await response.text();
        console.error("Update Staff Error:", errorText);
        throw new Error(errorText);
    }
    return true;
}

export async function deactivateStaff(staffId: string) {
    const response = await apiFetch(`${API_URL}/${staffId}`, {
        method: "DELETE",
    });

    if (!response.ok){
        throw new Error("Failed to delete staff");
    }
    return true;
}

export async function activateStaff(staffId: string) {
    const response = await apiFetch(`${API_URL}/${staffId}/activate`, {
        method: "PUT",
    });

    if (!response.ok) {
        throw new Error("Failed to activate staff");
    }
    return true;
}