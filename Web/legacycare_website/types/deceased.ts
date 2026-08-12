import type {
  DeceasedStorageResponse,
} from "@/types/mortuary";

export interface DeceasedResponse {
  deceasedId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  dateOfDeath: string;
  gender: string;
  causeOfDeath?: string | null;
  policyId: string;
  isReleased: boolean;
}

export interface CreateDeceasedRequest {
  deceasedId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  dateOfDeath: string;
  gender: string;
  causeOfDeath: string | null;
  policyId: string;
}

export interface UpdateDeceasedRequest {
  fullName: string;
  gender: string;
  causeOfDeath: string | null;
}

export interface DeceasedDetailsView
  extends DeceasedResponse {
  assignment?: DeceasedStorageResponse | null;

  storageId?: string | null;
  unitNumber?: string | null;
  assignmentId?: string | null;
  dateAssigned?: string | null;
  dateRemoved?: string | null;
}