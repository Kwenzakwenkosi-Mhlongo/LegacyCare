import { CreateBeneficiaryRequest, CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyStatusRequest, ChangePolicyResult } from "@/types/policy";
import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/Policy`;

export async function getPolicies() {
  const response = await apiFetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch policies");
  }

  return response.json();
}

export async function getPolicyById(policyId: string) {
  const response = await apiFetch(
    `${API_URL}/${policyId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch policy");
  }

  return response.json();
}

export async function createPolicy(data: CreatePolicyRequest) {
  const response = await apiFetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create policy");
  }

  return response.json();
}

export async function updatePolicy(
  policyId: string,
  data: UpdatePolicyRequest
) {
  const response = await apiFetch(
    `${API_URL}/${policyId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update policy");
  }

  return response.json();
}

export async function updatePolicyStatus(
  policyId: string,
  data: UpdatePolicyStatusRequest
): Promise<void> {
  const response = await apiFetch(
    `${API_URL}/${policyId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data.status),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText ||
        `Failed to update policy status (${response.status}).`
    );
  }
}

export async function changePolicyPackage(
  policyId: string, newPackageId: string
): Promise<ChangePolicyResult> {
  const response = await apiFetch(
    `${API_URL}/${policyId}/package`,
    {
      method: "PUT",
      body: JSON.stringify({
        packageId: newPackageId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null);

    throw new Error(
      error?.message ??
        `Failed to change policy (${response.status}).`
    );
  }

  return response.json();
}

export async function addBeneficiary(
  policyId: string,
  data: CreateBeneficiaryRequest
) {
  const response = await apiFetch(
    `${API_URL}/${policyId}/beneficiaries`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add beneficiary");
  }

  return response.json();
}

export async function removeBeneficiary(
  policyId: string,
  beneficiaryId: string
) {
  const response = await apiFetch(
    `${API_URL}/${policyId}/beneficiaries/${beneficiaryId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove beneficiary");
  }
}