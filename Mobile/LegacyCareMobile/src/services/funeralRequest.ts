// src/services/funeralRequest.ts

import {
  approveFuneralRequest,
  assignFuneralStaff,
  getAvailableFuneralStaff,
  getFuneralRequestById,
  getPendingFuneralRequests,
  rejectFuneralRequest,
} from "../../services/funeralRequest";

export type {
  AssignFuneralStaffResponse,
  AvailableFuneralStaffResponse,
  FuneralRequestDetails,
  FuneralStaff,
  FuneralStaffDeployment,
  ReviewFuneralResponse
} from "../../services/funeralRequest";

export {
  approveFuneralRequest,
  assignFuneralStaff,
  getAvailableFuneralStaff,
  getFuneralRequestById,
  getPendingFuneralRequests,
  rejectFuneralRequest
};

export async function getFuneralRequest(
  id: string
) {
  return getFuneralRequestById(id);
}

export async function reviewFuneralRequest(
  id: string,
  action: "Approve" | "Reject",
  staffRequired: number = 4,
  rejectionReason?: string
) {
  if (staffRequired !== 4) {
    throw new Error(
      "LegacyCare funeral requests require exactly 4 staff members."
    );
  }

  if (action === "Approve") {
    return approveFuneralRequest(id);
  }

  return rejectFuneralRequest(
    id,
    rejectionReason ?? ""
  );
}