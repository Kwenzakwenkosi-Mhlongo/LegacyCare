import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/BeneficiaryRequest`;

export interface BeneficiaryRequestResponse {
  requestId: string;
  userId: string;
  policyId: string;
  requestType: string;
  status: string;
  requestDate: string;
  fullName?: string;
  idNumber?: string;
  relationship?: string;
  description?: string;
  clientName?: string;
  beneficiaryId?: string;
}

export async function getBeneficiaryRequests(): Promise<BeneficiaryRequestResponse[]> {
  const response = await apiFetch(API_URL, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch beneficiary requests: ${errorText}`);
  }

  const data = await response.json();
  
  return data.map((req: any) => ({
    requestId: req.requestId,
    userId: req.userId,
    policyId: req.policyId,
    requestType: req.requestType || "Add",
    status: req.status || "Pending",
    requestDate: req.requestDate,
    fullName: req.fullName || "N/A",
    idNumber: req.idNumber || "N/A",
    relationship: req.relationship || "N/A",
    description: req.description || "",
    beneficiaryId: req.beneficiaryId,
    clientName: req.user?.fullName || "N/A",
  }));
}

export async function approveBeneficiaryRequest(requestId: string) {
  const response = await apiFetch(`${API_URL}/${requestId}/approve`, {
    method: "PUT",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to approve beneficiary request: ${errorText}`);
  }

  return response;
}

export async function rejectBeneficiaryRequest(requestId: string) {
  const response = await apiFetch(`${API_URL}/${requestId}/reject`, {
    method: "PUT",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to reject beneficiary request: ${errorText}`);
  }

  return response;
}