import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/client`;

export async function getClients() {
    const response = await apiFetch(API_URL);

    if (!response.ok){
        throw new Error("Failed to fetch clients");
    }
    return response.json();
}

export async function getClient(clientId: string) {
    const response = await apiFetch(`${API_URL}/${clientId}`);

    if (!response.ok){
        throw new Error("Failed to fetch client info");
    }
    return response.json();
}

export async function createClient(client: any) {
    const response = await apiFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(client),
    });

    if (!response.ok){
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    return response.json();
}

export async function updateClient(clientId: string, client: {
    fullName: string;
    idNumber: string;
    email: string;
    cellNo: string;
    address: string;
    isActive: boolean;

}) {
    const response = await apiFetch(`${API_URL}/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(client),
    });

    if (!response.ok){
        const errorText = await response.text();
        console.error("Update Client Error:", errorText);
        throw new Error(errorText);
    }
    return true;
}

export async function deactivateClient(clientId: string) {
    const response = await apiFetch(`${API_URL}/${clientId}`, {
        method: "DELETE",
    });

    if (!response.ok){
        throw new Error("Failed to delete client");
    }
    return true;
}

export async function activateClient(clientId: string) {
    const response = await apiFetch(`${API_URL}/${clientId}/activate`, {
        method: "PUT",
    });

    if (!response.ok) {
        throw new Error("Failed to activate client");
    }
    return true;
}
