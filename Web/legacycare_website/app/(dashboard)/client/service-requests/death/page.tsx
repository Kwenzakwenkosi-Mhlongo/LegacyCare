"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api";
type Policy = {
  policyId: number | string;
  policyNumber?: string;
  status?: string;
  policyStatus?: string;
  clientId?: number | string;
};

type Beneficiary = {
  beneficiaryId: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  relationship?: string;
  status?: string;
};

export default function ReportDeathPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [beneficiaries, setBeneficiaries] =
    useState<Beneficiary[]>([]);

  const [selectedPolicyId, setSelectedPolicyId] =
    useState("");

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] =
    useState("");

  const [dateOfDeath, setDateOfDeath] =
    useState("");

  const [relationshipToDeceased, setRelationshipToDeceased] =
    useState("");

  const [contactPerson, setContactPerson] =
    useState("");

  const [contactNumber, setContactNumber] =
    useState("");

  const [proofOfDeath, setProofOfDeath] =
    useState<File | null>(null);

  const [loadingPolicies, setLoadingPolicies] =
    useState(true);

  const [loadingBeneficiaries, setLoadingBeneficiaries] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // PAGE LOAD
  // =========================================================

  useEffect(() => {
    document.title = "Report a Death";

    loadPolicies();
  }, []);

  // =========================================================
  // LOAD CLIENT POLICIES
  // =========================================================

  const loadPolicies = async () => {
    try {
      setLoadingPolicies(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(
        `${API_URL}/Policy/client`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load policies (${response.status})`
        );
      }

      console.log(
        "[ReportDeath] Policies:",
        data
      );

      setPolicies(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "[ReportDeath] Policy error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your policies."
      );
    } finally {
      setLoadingPolicies(false);
    }
  };

  // =========================================================
  // LOAD BENEFICIARIES FOR SELECTED POLICY
  // =========================================================

  const loadBeneficiaries = async (
    policyId: string
  ) => {
    try {
      setLoadingBeneficiaries(true);
      setError("");

      setBeneficiaries([]);
      setSelectedBeneficiaryId("");

      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      console.log(
        "[ReportDeath] Loading beneficiaries for policy:",
        policyId
      );

      const response = await fetch(
        `${API_URL}/Beneficiary/policy/${policyId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load beneficiaries (${response.status})`
        );
      }

      console.log(
        "[ReportDeath] Backend beneficiaries:",
        data
      );

      // =====================================================
      // FRONTEND SAFETY FILTER
      // =====================================================
      //
      // Only Alive beneficiaries may appear.
      //
      // Alive    -> SHOW
      // Removed  -> HIDE
      // Deceased -> HIDE
      //
      // The backend already performs this filtering,
      // but we also filter here as a second safety layer.
      // =====================================================

      const aliveBeneficiaries: Beneficiary[] =
        Array.isArray(data)
          ? data.filter(
              (beneficiary: Beneficiary) =>
                String(
                  beneficiary.status || ""
                )
                  .trim()
                  .toLowerCase() === "alive"
            )
          : [];

      console.log(
        "[ReportDeath] Eligible ALIVE beneficiaries:",
        aliveBeneficiaries
      );

      setBeneficiaries(
        aliveBeneficiaries
      );
    } catch (err) {
      console.error(
        "[ReportDeath] Beneficiary error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load beneficiaries."
      );
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  // =========================================================
  // POLICY CHANGE
  // =========================================================

  const handlePolicyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const policyId =
      event.target.value;

    setSelectedPolicyId(policyId);

    setSelectedBeneficiaryId("");

    setBeneficiaries([]);

    setDateOfDeath("");

    setRelationshipToDeceased("");

    setContactPerson("");

    setContactNumber("");

    setProofOfDeath(null);

    if (policyId) {
      loadBeneficiaries(policyId);
    }
  };

  // =========================================================
  // BENEFICIARY CHANGE
  // =========================================================

  const handleBeneficiaryChange = (
    beneficiaryId: string
  ) => {
    setSelectedBeneficiaryId(
      beneficiaryId
    );
  };

  // =========================================================
  // FILE CHANGE
  // =========================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    setProofOfDeath(file);
  };

  // =========================================================
  // SUBMIT DEATH NOTIFICATION
  // =========================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!selectedPolicyId) {
      setError(
        "Please select a policy."
      );
      return;
    }

    if (!selectedBeneficiaryId) {
      setError(
        "Please select the person who has died."
      );
      return;
    }

    if (!dateOfDeath) {
      setError(
        "Please enter the date of death."
      );
      return;
    }

    if (
      !relationshipToDeceased.trim()
    ) {
      setError(
        "Please provide your relationship to the deceased."
      );
      return;
    }

    if (!contactPerson.trim()) {
      setError(
        "Please provide the contact person's name."
      );
      return;
    }

    if (!contactNumber.trim()) {
      setError(
        "Please provide a contact number."
      );
      return;
    }

    if (!proofOfDeath) {
      setError(
        "Please upload the death certificate or proof of death."
      );
      return;
    }

    // =====================================================
    // FILE VALIDATION
    // =====================================================

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        proofOfDeath.type
      )
    ) {
      setError(
        "Only PDF, JPG, JPEG and PNG files are accepted."
      );
      return;
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      proofOfDeath.size >
      maxFileSize
    ) {
      setError(
        "The proof of death document must be 10 MB or smaller."
      );
      return;
    }

    // =====================================================
    // SUBMIT
    // =====================================================

    try {
      setSubmitting(true);

      const token = getToken();

      if (!token) {
        setError(
          "You are not logged in."
        );
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "PolicyId",
        selectedPolicyId
      );

      formData.append(
        "BeneficiaryId",
        selectedBeneficiaryId
      );

      formData.append(
        "DateOfDeath",
        dateOfDeath
      );

      formData.append(
        "RelationshipToDeceased",
        relationshipToDeceased.trim()
      );

      formData.append(
        "ContactPerson",
        contactPerson.trim()
      );

      formData.append(
        "ContactNumber",
        contactNumber.trim()
      );

      formData.append(
        "ProofOfDeathDocument",
        proofOfDeath
      );

      console.log(
        "[ReportDeath] Submitting death notification..."
      );

      const response = await fetch(
        `${API_URL}/DeathNotification`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to submit death notification (${response.status})`
        );
      }

      console.log(
        "[ReportDeath] Submitted:",
        data
      );

      // =====================================================
      // IMPORTANT
      //
      // Client submission does NOT mark the beneficiary
      // as deceased.
      //
      // Staff/Admin must verify and approve first.
      // =====================================================

      setSuccess(
        "Death notification submitted successfully. LegacyCare will verify the information and documentation before the beneficiary is marked as deceased and the funeral process can continue."
      );

      // =====================================================
      // CLEAR FORM
      // =====================================================

      setSelectedPolicyId("");

      setSelectedBeneficiaryId("");

      setBeneficiaries([]);

      setDateOfDeath("");

      setRelationshipToDeceased("");

      setContactPerson("");

      setContactNumber("");

      setProofOfDeath(null);

      const fileInput =
        document.getElementById(
          "proofOfDeath"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(
        "[ReportDeath] Submit error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit death notification."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // GET BENEFICIARY NAME
  // =========================================================

  const getBeneficiaryName = (
    beneficiary: Beneficiary
  ) => {
    if (beneficiary.fullName) {
      return beneficiary.fullName;
    }

    if (beneficiary.name) {
      return beneficiary.name;
    }

    return `${beneficiary.firstName || ""} ${
      beneficiary.lastName || ""
    }`.trim();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>

          <div className="mb-3">

            <Link
              href="/client/service-requests"
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              ← Back to Service Requests
            </Link>

          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Report a Death
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Report the death of a beneficiary and
            provide the required information and
            documentation. LegacyCare will verify
            the submission before the beneficiary
            status is updated.
          </p>

        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
          🕊️
        </div>

      </div>

      {/* =====================================================
          PROCESS INFORMATION
      ===================================================== */}

      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">

        <div className="flex items-start gap-3">

          <div className="text-xl">
            ℹ️
          </div>

          <div>

            <h2 className="font-semibold text-teal-900">
              What happens after you submit?
            </h2>

            <p className="mt-1 text-sm leading-6 text-teal-800">
              Your notification is sent to LegacyCare
              for verification. Staff will review the
              information and proof of death before the
              beneficiary status is changed to deceased.
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ✓
            </div>

            <div>

              <p className="font-semibold text-green-800">
                Death notification submitted
              </p>

              <p className="mt-1 text-sm leading-6 text-green-700">
                {success}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">

                <Link
                  href="/client/service-requests"
                  className="inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  View My Requests
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess("");
                    setError("");
                    loadPolicies();
                  }}
                  className="inline-flex rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  Report Another Death
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>

              <p className="font-semibold text-red-800">
                Unable to continue
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          FORM
      ===================================================== */}

      {!success && (
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* =================================================
              STEP 1 - POLICY
          ================================================= */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  1
                </div>

                <div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Select Policy
                  </h2>

                  <p className="text-sm text-gray-500">
                    Select the policy associated with
                    the deceased beneficiary.
                  </p>

                </div>

              </div>

            </div>

            <label
              htmlFor="policy"
              className="block text-sm font-medium text-gray-700"
            >
              Policy
            </label>

            {loadingPolicies ? (

              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Loading your policies...
              </div>

            ) : policies.length === 0 ? (

              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No policies were found on your account.
              </div>

            ) : (

              <select
                id="policy"
                value={selectedPolicyId}
                onChange={handlePolicyChange}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                required
              >

                <option value="">
                  Select a policy
                </option>

                {policies.map(
                  (policy) => (
                    <option
                      key={policy.policyId}
                      value={policy.policyId}
                    >
                      {policy.policyNumber ||
                        `Policy ${policy.policyId}`}
                      {policy.status ||
                      policy.policyStatus
                        ? ` — ${
                            policy.status ||
                            policy.policyStatus
                          }`
                        : ""}
                    </option>
                  )
                )}

              </select>

            )}

          </div>

          {/* =================================================
              STEP 2 - BENEFICIARY
          ================================================= */}

          {selectedPolicyId && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                    2
                  </div>

                  <div>

                    <h2 className="text-lg font-semibold text-gray-900">
                      Select Person
                    </h2>

                    <p className="text-sm text-gray-500">
                      Select the beneficiary who has died.
                    </p>

                  </div>

                </div>

              </div>

              {loadingBeneficiaries ? (

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                  Loading beneficiaries...
                </div>

              ) : beneficiaries.length === 0 ? (

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

                  <div className="flex items-start gap-3">

                    <div className="text-xl">
                      ℹ️
                    </div>

                    <div>

                      <p className="font-medium text-amber-800">
                        No eligible beneficiaries found
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-700">
                        There are no alive beneficiaries
                        available to report for this policy.
                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="space-y-3">

                  {beneficiaries.map(
                    (beneficiary) => {

                      const selected =
                        String(
                          beneficiary.beneficiaryId
                        ) ===
                        selectedBeneficiaryId;

                      return (
                        <button
                          key={
                            beneficiary.beneficiaryId
                          }
                          type="button"
                          onClick={() =>
                            handleBeneficiaryChange(
                              String(
                                beneficiary.beneficiaryId
                              )
                            )
                          }
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100"
                              : "border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50"
                          }`}
                        >

                          <div className="flex items-center justify-between gap-4">

                            <div>

                              <p className="font-semibold text-gray-900">
                                {getBeneficiaryName(
                                  beneficiary
                                ) ||
                                  "Unnamed Beneficiary"}
                              </p>

                              {beneficiary.relationship && (
                                <p className="mt-1 text-sm text-gray-500">
                                  Relationship:{" "}
                                  {
                                    beneficiary.relationship
                                  }
                                </p>
                              )}

                              <p className="mt-1 text-xs font-medium text-green-600">
                                Status: Alive
                              </p>

                            </div>

                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                                selected
                                  ? "border-teal-600 bg-teal-600 text-white"
                                  : "border-gray-300"
                              }`}
                            >
                              {selected && "✓"}
                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              )}

            </div>
          )}

          {/* =================================================
              STEP 3 - DEATH INFORMATION
          ================================================= */}

          {selectedBeneficiaryId && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                    3
                  </div>

                  <div>

                    <h2 className="text-lg font-semibold text-gray-900">
                      Death Information
                    </h2>

                    <p className="text-sm text-gray-500">
                      Provide the details relating to the death.
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* DATE OF DEATH */}

                <div>

                  <label
                    htmlFor="dateOfDeath"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date of Death
                  </label>

                  <input
                    id="dateOfDeath"
                    type="date"
                    value={dateOfDeath}
                    onChange={(event) =>
                      setDateOfDeath(
                        event.target.value
                      )
                    }
                    max={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    required
                  />

                </div>

                {/* RELATIONSHIP */}

                <div>

                  <label
                    htmlFor="relationship"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your Relationship to the Deceased
                  </label>

                  <input
                    id="relationship"
                    type="text"
                    value={
                      relationshipToDeceased
                    }
                    onChange={(event) =>
                      setRelationshipToDeceased(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Son, Daughter, Spouse"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    required
                  />

                </div>

                {/* CONTACT PERSON */}

                <div>

                  <label
                    htmlFor="contactPerson"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contact Person
                  </label>

                  <input
                    id="contactPerson"
                    type="text"
                    value={contactPerson}
                    onChange={(event) =>
                      setContactPerson(
                        event.target.value
                      )
                    }
                    placeholder="Full name"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    required
                  />

                </div>

                {/* CONTACT NUMBER */}

                <div>

                  <label
                    htmlFor="contactNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contact Number
                  </label>

                  <input
                    id="contactNumber"
                    type="tel"
                    value={contactNumber}
                    onChange={(event) =>
                      setContactNumber(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 082 123 4567"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    required
                  />

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              STEP 4 - PROOF OF DEATH
          ================================================= */}

          {selectedBeneficiaryId && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                    4
                  </div>

                  <div>

                    <h2 className="text-lg font-semibold text-gray-900">
                      Proof of Death
                    </h2>

                    <p className="text-sm text-gray-500">
                      Upload the death certificate or
                      other accepted proof of death.
                    </p>

                  </div>

                </div>

              </div>

              <label
                htmlFor="proofOfDeath"
                className="block text-sm font-medium text-gray-700"
              >
                Death Certificate / Proof of Death
              </label>

              <input
                id="proofOfDeath"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-teal-50 file:px-4 file:py-3 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
                required
              />

              {proofOfDeath && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">

                  <p className="text-sm font-medium text-gray-900">
                    Selected document
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {proofOfDeath.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {(
                      proofOfDeath.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>

                </div>
              )}

              <p className="mt-3 text-xs text-gray-500">
                Accepted formats: PDF, JPG, JPEG and PNG.
                Maximum file size: 10 MB.
              </p>

            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

          {selectedBeneficiaryId && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                  <h2 className="font-semibold text-gray-900">
                    Submit Death Notification
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Your submission will be sent to
                    LegacyCare for verification. The
                    beneficiary status will only be
                    updated after staff/admin approval.
                  </p>

                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Death Notification"}
                </button>

              </div>

            </div>
          )}

        </form>
      )}

    </div>
  );
}