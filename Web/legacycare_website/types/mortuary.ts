export interface StorageResponse {
  storageId: string;
  unitNumber: string;
  branchId: string;
  isAvailable: boolean;
}

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

export interface DeceasedStorageResponse {
  assignmentId: string;
  storageId: string;
  deceasedId: string;
  dateAssigned: string;
  dateRemoved?: string | null;

  storage?: StorageResponse | null;
  deceased?: DeceasedResponse | null;
}

export interface MortuaryUnitView {
  storageId: string;
  unitNumber: string;
  branchId: string;
  isAvailable: boolean;

  assignmentId?: string | null;
  deceasedId?: string | null;
  deceasedName?: string | null;
  dateAssigned?: string | null;
}