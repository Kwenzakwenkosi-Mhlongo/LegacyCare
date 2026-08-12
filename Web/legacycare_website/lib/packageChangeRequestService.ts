import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/PackageChangeRequest`;

export interface PackageChangeRequestResponse {
  requestId: string;
  userId: string;
  policyId: string;
  newPackageId: string;
  status: string;
  requestDate: string;
  clientName?: string;
  currentPackage?: string;
  newPackage?: string;
  description?: string;
}

export async function getPackageChangeRequests(): Promise<PackageChangeRequestResponse[]> {
  const response = await apiFetch(API_URL, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch package change requests: ${errorText}`);
  }

  const data = await response.json();
  
  return data.map((req: any) => ({
    requestId: req.requestId,
    userId: req.userId,
    policyId: req.policyId,
    newPackageId: req.newPackageId,
    status: req.status || "Pending",
    requestDate: req.requestDate,
    clientName: req.user?.fullName || "N/A",
    currentPackage: req.currentPackage || "N/A",
    newPackage: req.newPackage || "N/A",
    description: req.description || "",
  }));
}

export async function approvePackageChangeRequest(requestId: string) {
  const response = await apiFetch(`${API_URL}/${requestId}/approve`, {
    method: "PUT",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to approve package change request: ${errorText}`);
  }

  return response;
}

export async function rejectPackageChangeRequest(requestId: string) {
  const response = await apiFetch(`${API_URL}/${requestId}/reject`, {
    method: "PUT",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to reject package change request: ${errorText}`);
  }

  return response;
}