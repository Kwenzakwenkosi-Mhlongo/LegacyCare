export type PolicyStatus =
  | "Inactive"
  | "Active"
  | "Discontinued";

export type BeneficiaryStatus =
  | "Deceased"
  | "Alive";

export type BeneficiaryRelationship =
  | "Spouse"
  | "Child"
  | "Parent"
  | "Sibling"
  | "GrandParent"
  | "Other";


export interface BeneficiaryResponse {
  beneficiaryId: string;
  fullName: string;
  idNumber: string;
  relationship: BeneficiaryRelationship;
  status: BeneficiaryStatus;
}

export interface PolicyResponse {
  policyId: string;
  userId: string;
  clientName: string;
  packageId: string;
  packageName: string;
  startDate: string;
  endDate?: string | null;
  status: PolicyStatus;
  beneficiaries: BeneficiaryResponse[];
}

export interface CreatePolicyRequest {
  userId: string;
  packageId: string;
  startDate: string;
  beneficiaries: CreateBeneficiaryRequest[];

}

export interface UpdatePolicyRequest {
  startDate: string;
}

export interface UpdatePolicyStatusRequest {
  status: PolicyStatus;
}

export interface CreateBeneficiaryRequest {
  fullName: string;
  idNumber: string;
  relationship: number;
}

export interface ChangePolicyResult {
    previousPolicyId: string;
    newPolicyId: string;
    clientId: string;
    packageId: string;
    status: string;
    beneficiariesCopied: number;
}