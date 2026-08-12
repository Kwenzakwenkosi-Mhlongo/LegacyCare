import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/Authentication`;


export interface LoginResponse {
    token: string;
    expiration: string;
    fullName: string;
    email: string;
    role: string;
}
export async function login(email: string, password: string) : Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",  
        },
        body: JSON.stringify({email, password}),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 
                        "Invalid email or password");
    }
    return await response.json();
}
