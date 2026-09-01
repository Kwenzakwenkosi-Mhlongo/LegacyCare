// app/(dashboard)/client/report-death/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type Policy = {
  policyId: string | number;
  policyNumber?: string;
  status?: string;
  policyStatus?: string;
};

type Beneficiary = {
  beneficiaryId: string | number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  relationship?: string;
  status?: string;
};

type BodyLocationType =
  | "Hospital"
  | "LegacyCareMortuary"
  | "GovernmentMortuary"
  | "HomeScene"
  | "Other"
  | "";

function getBeneficiaryName(
  beneficiary: Beneficiary
): string {
  if (beneficiary.fullName?.trim()) {
    return beneficiary.fullName;
  }

  if (beneficiary.name?.trim()) {
    return beneficiary.name;
  }

  return `${beneficiary.firstName || ""} ${
    beneficiary.lastName || ""
  }`.trim();
}

export default function ReportDeathPage() {
  const [policies, setPolicies] =
    useState<Policy[]>([]);

  const [beneficiaries, setBeneficiaries] =
    useState<Beneficiary[]>([]);

  const [selectedPolicyId, setSelectedPolicyId] =
    useState("");

  const [
    selectedBeneficiaryId,
    setSelectedBeneficiaryId,
  ] = useState("");

  const [dateOfDeath, setDateOfDeath] =
    useState("");

  const [
    relationshipToDeceased,
    setRelationshipToDeceased,
  ] = useState("");

  const [contactPerson, setContactPerson] =
    useState("");

  const [contactNumber, setContactNumber] =
    useState("");

  const [
    bodyLocationType,
    setBodyLocationType,
  ] = useState<BodyLocationType>("");

  const [
    bodyLocationAddress,
    setBodyLocationAddress,
  ] = useState("");

  const [mortuaryName, setMortuaryName] =
    useState("");

  const [proofOfDeath, setProofOfDeath] =
    useState<File | null>(null);

  const [
    loadingPolicies,
    setLoadingPolicies,
  ] = useState(true);

  const [
    loadingBeneficiaries,
    setLoadingBeneficiaries,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    document.title = "Report a Death";
    void loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoadingPolicies(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response = await fetch(
        `${API_URL}/Policy/client`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load policies. (${response.status})`
        );
      }

      setPolicies(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "[ReportDeath] Policy error:",
        err
      );

      setPolicies([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your policies."
      );
    } finally {
      setLoadingPolicies(false);
    }
  };

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
        throw new Error(
          "You are not logged in."
        );
      }

      const response = await fetch(
        `${API_URL}/Beneficiary/policy/${policyId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load beneficiaries. (${response.status})`
        );
      }

      const aliveBeneficiaries:
        Beneficiary[] = Array.isArray(data)
        ? data.filter(
            (beneficiary: Beneficiary) =>
              String(
                beneficiary.status || ""
              )
                .trim()
                .toLowerCase() === "alive"
          )
        : [];

      setBeneficiaries(
        aliveBeneficiaries
      );
    } catch (err) {
      console.error(
        "[ReportDeath] Beneficiary error:",
        err
      );

      setBeneficiaries([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load beneficiaries."
      );
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  const resetForm = () => {
    setSelectedPolicyId("");
    setSelectedBeneficiaryId("");

    setBeneficiaries([]);

    setDateOfDeath("");

    setRelationshipToDeceased("");
    setContactPerson("");
    setContactNumber("");

    setBodyLocationType("");
    setBodyLocationAddress("");
    setMortuaryName("");

    setProofOfDeath(null);

    const fileInput =
      document.getElementById(
        "proofOfDeath"
      ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handlePolicyChange = (
    event:
      React.ChangeEvent<HTMLSelectElement>
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

    setBodyLocationType("");
    setBodyLocationAddress("");
    setMortuaryName("");

    setProofOfDeath(null);

    if (policyId) {
      void loadBeneficiaries(policyId);
    }
  };

  const handleBodyLocationChange = (
    event:
      React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value =
      event.target
        .value as BodyLocationType;

    setBodyLocationType(value);

    setBodyLocationAddress("");
    setMortuaryName("");
  };

  const handleFileChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {
    setProofOfDeath(
      event.target.files?.[0] || null
    );
  };

  const validateForm = (): string | null => {
    if (!selectedPolicyId) {
      return "Please select a policy.";
    }

    if (!selectedBeneficiaryId) {
      return "Please select the person who has died.";
    }

    if (!dateOfDeath) {
      return "Please enter the date of death.";
    }

    if (
      !relationshipToDeceased.trim()
    ) {
      return "Please provide your relationship to the deceased.";
    }

    if (!contactPerson.trim()) {
      return "Please provide the contact person's name.";
    }

    if (!contactNumber.trim()) {
      return "Please provide a contact number.";
    }

    if (!bodyLocationType) {
      return "Please specify where the body is currently located.";
    }

    const requiresAddress =
      bodyLocationType === "Hospital" ||
      bodyLocationType ===
        "GovernmentMortuary" ||
      bodyLocationType === "HomeScene" ||
      bodyLocationType === "Other";

    if (
      requiresAddress &&
      !bodyLocationAddress.trim()
    ) {
      return "Please provide the current body location or address.";
    }

    if (
      bodyLocationType ===
        "GovernmentMortuary" &&
      !mortuaryName.trim()
    ) {
      return "Please provide the government mortuary name.";
    }

    if (!proofOfDeath) {
      return "Please upload the death certificate or proof of death.";
    }

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
      return "Only PDF, JPG, JPEG and PNG files are accepted.";
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      proofOfDeath.size >
      maxFileSize
    ) {
      return "The proof of death document must be 10 MB or smaller.";
    }

    return null;
  };

  const handleSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!proofOfDeath) {
      setError(
        "Proof of death is required."
      );
      return;
    }

    try {
      setSubmitting(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
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

      /*
       * These names MUST match the backend DTO exactly.
       */
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
        "BodyLocationType",
        bodyLocationType
      );

      if (
        bodyLocationAddress.trim()
      ) {
        formData.append(
          "BodyLocationAddress",
          bodyLocationAddress.trim()
        );
      }

      if (mortuaryName.trim()) {
        formData.append(
          "MortuaryName",
          mortuaryName.trim()
        );
      }

      formData.append(
        "ProofOfDeathDocument",
        proofOfDeath
      );

      /*
       * Keep this log until REQ-00006 is verified.
       */
      console.log(
        "[ReportDeath] SUBMIT VALUES:",
        {
          policyId:
            selectedPolicyId,

          beneficiaryId:
            selectedBeneficiaryId,

          dateOfDeath,

          relationshipToDeceased:
            relationshipToDeceased.trim(),

          contactPerson:
            contactPerson.trim(),

          contactNumber:
            contactNumber.trim(),

          bodyLocationType,

          bodyLocationAddress:
            bodyLocationAddress.trim(),

          mortuaryName:
            mortuaryName.trim(),
        }
      );

      console.log(
        "[ReportDeath] FORM DATA:",
        Array.from(
          formData.entries()
        )
      );

      const response = await fetch(
        `${API_URL}/DeathNotification`,
        {
          method: "POST",

          /*
           * Do not manually set Content-Type
           * when sending FormData.
           */
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

      console.log(
        "[ReportDeath] RESPONSE:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to submit death notification. (${response.status})`
        );
      }

      setSuccess(
        `Death notification ${
          data?.requestNumber
            ? `${data.requestNumber} `
            : ""
        }submitted successfully. The beneficiary remains Alive while the notification is Pending. LegacyCare staff will review the report, proof of death and current body location.`
      );

      resetForm();
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* HEADER */}

      <div>
        <Link
          href="/client/service-requests"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Report a Death
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Report the death of a beneficiary,
          provide your contact information,
          the current body location and proof
          of death.
        </p>
      </div>

      {/* PROCESS INFO */}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-900">
          How the process works
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          You only report the current body
          location. You do not choose a
          LegacyCare storage unit. Staff will
          collect the body if necessary and
          select an available storage unit from
          the correct branch before approval.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-800">
            Death notification submitted
          </p>

          <p className="mt-2 text-sm leading-6 text-green-700">
            {success}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/client/service-requests"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              View My Requests
            </Link>

            <button
              type="button"
              onClick={() => {
                setSuccess("");
                setError("");
                void loadPolicies();
              }}
              className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700"
            >
              Report Another Death
            </button>
          </div>
        </div>
      )}

      {!success && (
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* POLICY */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              1. Select Policy
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select the policy associated
              with the deceased beneficiary.
            </p>

            {loadingPolicies ? (
              <p className="mt-5 text-sm text-gray-500">
                Loading policies...
              </p>
            ) : (
              <select
                value={
                  selectedPolicyId
                }
                onChange={
                  handlePolicyChange
                }
                className="mt-5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
                required
              >
                <option value="">
                  Select a policy
                </option>

                {policies.map(
                  (policy) => (
                    <option
                      key={
                        policy.policyId
                      }
                      value={
                        policy.policyId
                      }
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
          </section>

          {/* BENEFICIARY */}

          {selectedPolicyId && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                2. Select Person
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select the Alive beneficiary
                who has died.
              </p>

              {loadingBeneficiaries ? (
                <p className="mt-5 text-sm text-gray-500">
                  Loading beneficiaries...
                </p>
              ) : beneficiaries.length ===
                0 ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  No Alive beneficiaries are
                  available for this policy.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
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
                            setSelectedBeneficiaryId(
                              String(
                                beneficiary.beneficiaryId
                              )
                            )
                          }
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100"
                              : "border-gray-200 hover:border-teal-300"
                          }`}
                        >
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
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}

          {selectedBeneficiaryId && (
            <>
              {/* DEATH + CONTACT */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  3. Death & Contact Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  These contact details will be
                  shown to the Admin when they
                  review the notification.
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">

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
                      value={
                        dateOfDeath
                      }
                      max={
                        new Date()
                          .toISOString()
                          .split("T")[0]
                      }
                      onChange={(
                        event
                      ) =>
                        setDateOfDeath(
                          event.target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="relationshipToDeceased"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Your Relationship to the
                      Deceased
                    </label>

                    <input
                      id="relationshipToDeceased"
                      name="relationshipToDeceased"
                      type="text"
                      value={
                        relationshipToDeceased
                      }
                      onChange={(
                        event
                      ) =>
                        setRelationshipToDeceased(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. Spouse, Son, Daughter"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactPerson"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contact Person
                    </label>

                    <input
                      id="contactPerson"
                      name="contactPerson"
                      type="text"
                      value={
                        contactPerson
                      }
                      onChange={(
                        event
                      ) =>
                        setContactPerson(
                          event.target
                            .value
                        )
                      }
                      placeholder="Full name"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contact Number
                    </label>

                    <input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      value={
                        contactNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setContactNumber(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 0821234567"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      required
                    />
                  </div>

                </div>
              </section>

              {/* BODY LOCATION */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  4. Current Body Location
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Tell LegacyCare where the body
                  is currently located.
                </p>

                <div className="mt-5">
                  <label
                    htmlFor="bodyLocationType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Location
                  </label>

                  <select
                    id="bodyLocationType"
                    value={
                      bodyLocationType
                    }
                    onChange={
                      handleBodyLocationChange
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
                    required
                  >
                    <option value="">
                      Select location
                    </option>

                    <option value="Hospital">
                      Hospital
                    </option>

                    <option value="LegacyCareMortuary">
                      LegacyCare Mortuary
                    </option>

                    <option value="GovernmentMortuary">
                      Government Mortuary
                    </option>

                    <option value="HomeScene">
                      Home / Scene
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                {bodyLocationType ===
                  "Hospital" && (
                  <div className="mt-5">
                    <label
                      htmlFor="hospitalLocation"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Hospital Name / Address
                    </label>

                    <input
                      id="hospitalLocation"
                      type="text"
                      value={
                        bodyLocationAddress
                      }
                      onChange={(
                        event
                      ) =>
                        setBodyLocationAddress(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. Pretoria North Hospital"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      required
                    />
                  </div>
                )}

                {bodyLocationType ===
                  "GovernmentMortuary" && (
                  <div className="mt-5 grid gap-5 md:grid-cols-2">

                    <div>
                      <label
                        htmlFor="mortuaryName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Government Mortuary Name
                      </label>

                      <input
                        id="mortuaryName"
                        type="text"
                        value={
                          mortuaryName
                        }
                        onChange={(
                          event
                        ) =>
                          setMortuaryName(
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. Pretoria Government Mortuary"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="governmentMortuaryAddress"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Mortuary Address
                      </label>

                      <input
                        id="governmentMortuaryAddress"
                        type="text"
                        value={
                          bodyLocationAddress
                        }
                        onChange={(
                          event
                        ) =>
                          setBodyLocationAddress(
                            event.target
                              .value
                          )
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                        required
                      />
                    </div>

                  </div>
                )}

                {(bodyLocationType ===
                  "HomeScene" ||
                  bodyLocationType ===
                    "Other") && (
                  <div className="mt-5">
                    <label
                      htmlFor="bodyLocationAddress"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address / Location
                    </label>

                    <input
                      id="bodyLocationAddress"
                      type="text"
                      value={
                        bodyLocationAddress
                      }
                      onChange={(
                        event
                      ) =>
                        setBodyLocationAddress(
                          event.target
                            .value
                        )
                      }
                      placeholder="Enter the current location"
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                      required
                    />
                  </div>
                )}

                {bodyLocationType ===
                  "LegacyCareMortuary" && (
                  <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
                    LegacyCare staff will assign
                    an available storage unit from
                    the correct branch. You do not
                    enter a storage number.
                  </div>
                )}
              </section>

              {/* PROOF */}

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  5. Proof of Death
                </h2>

                <input
                  id="proofOfDeath"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={
                    handleFileChange
                  }
                  className="mt-5 block w-full text-sm"
                  required
                />

                <p className="mt-2 text-xs text-gray-500">
                  PDF, JPG, JPEG or PNG.
                  Maximum file size: 10 MB.
                </p>
              </section>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="w-full rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Death Notification"}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}