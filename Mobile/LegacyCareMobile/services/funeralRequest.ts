// services/funeralRequest.ts

import { apiRequest } from "./api";

// ============================================================
// TYPES
// ============================================================

export type FuneralStaff = {
  staffId: string;
  displayStaffId?: string | null;
  fullName?: string | null;
  role?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  isAlreadyDeployed?: boolean;
};

export type FuneralStaffDeployment = {
  funeralStaffDeploymentId?: number;
  staffId: string;
  displayStaffId?: string | null;
  fullName?: string | null;
  role?: string | null;
  branchId?: string | null;
  deployedBy?: string | null;
  deployedDate?: string | null;
};

export type FuneralRequestDetails = {
  funeralRequestId: string;

  deathNotificationId?: string | null;
  clientId?: string | null;

  branchId?: string | null;
  branchName?: string | null;

  funeralType?: string | null;

  funeralDate?: string | null;
  funeralTime?: string | null;

  venue?: string | null;
  notes?: string | null;

  status?: string | null;
  rejectionReason?: string | null;

  staffRequired?: number;
  staffAssigned?: number;
  staffRemaining?: number;
  staffingStatus?: string | null;

  approvedByClerkId?: string | null;
  approvedDate?: string | null;

  createdDate?: string | null;
  updatedDate?: string | null;

  staffDeployed?: FuneralStaffDeployment[];
};

export type AvailableFuneralStaffResponse = {
  staffRequired: number;
  availableCount: number;
  staff: FuneralStaff[];
};

export type AssignFuneralStaffResponse = {
  message?: string;
  funeralRequestId: string;

  staffRequired: number;
  staffAssigned: number;
  staffRemaining: number;
  staffingStatus: string;

  staff: FuneralStaffDeployment[];
};

export type ReviewFuneralResponse = {
  message?: string;

  funeralRequestId: string;
  serviceRequestId?: number | null;

  status: string;

  branchId?: string | null;
  branchName?: string | null;

  staffRequired?: number;
  staffAssigned?: number;
  staffRemaining?: number;
  staffingStatus?: string | null;

  approvedByClerkId?: string | null;
  approvedDate?: string | null;

  rejectionReason?: string | null;
};

// ============================================================
// GET PENDING FUNERAL REQUESTS
// GET /api/FuneralRequest/clerk/pending
// ============================================================

export async function getPendingFuneralRequests():
  Promise<FuneralRequestDetails[]> {
  return apiRequest<FuneralRequestDetails[]>(
    "/FuneralRequest/clerk/pending"
  );
}

// ============================================================
// GET FUNERAL REQUEST BY ID
// GET /api/FuneralRequest/{id}
// ============================================================

export async function getFuneralRequestById(
  funeralRequestId: string
): Promise<FuneralRequestDetails> {
  const id = funeralRequestId.trim();

  if (!id) {
    throw new Error(
      "Funeral request ID is required."
    );
  }

  return apiRequest<FuneralRequestDetails>(
    `/FuneralRequest/${encodeURIComponent(id)}`
  );
}

// ============================================================
// GET AVAILABLE BRANCH STAFF
// GET /api/FuneralRequest/clerk/{id}/available-staff
// ============================================================

export async function getAvailableFuneralStaff(
  funeralRequestId: string
): Promise<AvailableFuneralStaffResponse> {
  const id = funeralRequestId.trim();

  if (!id) {
    throw new Error(
      "Funeral request ID is required."
    );
  }

  return apiRequest<AvailableFuneralStaffResponse>(
    `/FuneralRequest/clerk/${encodeURIComponent(
      id
    )}/available-staff`
  );
}

// ============================================================
// ASSIGN EXACTLY 4 STAFF
// PUT /api/FuneralRequest/clerk/{id}/staff
// ============================================================

export async function assignFuneralStaff(
  funeralRequestId: string,
  staffIds: string[]
): Promise<AssignFuneralStaffResponse> {
  const id =
    funeralRequestId.trim();

  if (!id) {
    throw new Error(
      "Funeral request ID is required."
    );
  }

  const uniqueStaffIds =
    Array.from(
      new Set(
        staffIds
          .map((staffId) =>
            staffId.trim()
          )
          .filter(Boolean)
      )
    );

  if (uniqueStaffIds.length !== 4) {
    throw new Error(
      "Exactly 4 staff members must be selected."
    );
  }

  return apiRequest<AssignFuneralStaffResponse>(
    `/FuneralRequest/clerk/${encodeURIComponent(
      id
    )}/staff`,
    {
      method: "PUT",

      body: JSON.stringify({
        staffIds:
          uniqueStaffIds,
      }),
    }
  );
}

// ============================================================
// APPROVE FUNERAL
// PUT /api/FuneralRequest/clerk/{id}/review
// ============================================================

export async function approveFuneralRequest(
  funeralRequestId: string
): Promise<ReviewFuneralResponse> {
  const id =
    funeralRequestId.trim();

  if (!id) {
    throw new Error(
      "Funeral request ID is required."
    );
  }

  return apiRequest<ReviewFuneralResponse>(
    `/FuneralRequest/clerk/${encodeURIComponent(
      id
    )}/review`,
    {
      method: "PUT",

      body: JSON.stringify({
        action: "Approve",
        rejectionReason: null,
        staffRequired: 4,
      }),
    }
  );
}

// ============================================================
// REJECT FUNERAL
// PUT /api/FuneralRequest/clerk/{id}/review
// ============================================================

export async function rejectFuneralRequest(
  funeralRequestId: string,
  rejectionReason: string
): Promise<ReviewFuneralResponse> {
  const id =
    funeralRequestId.trim();

  const reason =
    rejectionReason.trim();

  if (!id) {
    throw new Error(
      "Funeral request ID is required."
    );
  }

  if (!reason) {
    throw new Error(
      "A rejection reason is required."
    );
  }

  return apiRequest<ReviewFuneralResponse>(
    `/FuneralRequest/clerk/${encodeURIComponent(
      id
    )}/review`,
    {
      method: "PUT",

      body: JSON.stringify({
        action: "Reject",
        rejectionReason:
          reason,
        staffRequired: 4,
      }),
    }
  );
}