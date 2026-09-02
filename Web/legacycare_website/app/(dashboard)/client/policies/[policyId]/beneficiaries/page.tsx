// ============================================================================
// File:
// Web/legacycare_website/app/(dashboard)/client/policies/[policyId]/beneficiaries/page.tsx
// ============================================================================

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

const RELATIONSHIPS = [
  { value: 0, label: "Spouse" },
  { value: 1, label: "Child" },
  { value: 2, label: "Parent" },
  { value: 3, label: "Sibling" },
  { value: 4, label: "Grandparent" },
  { value: 5, label: "Other" },
];

type Beneficiary = {
  beneficiaryId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
  relationship: number | string;
  status: number | string;
  policyId: string;
};

type BeneficiaryRequest = {
  requestId: string;
  requestType: number | string;
  status: number | string;
  requestDate: string;
  beneficiaryId?: string | null;
  fullName?: string | null;
  description?: string | null;
};

type PolicyPackage = {
  packageId: string;
  name: string;
  maxBeneficiaries: number;
};

type ClientPolicy = {
  policyId: string;
  packageId?: string | null;
  packageName?: string | null;
  package?: PolicyPackage | null;
};

type FormState = {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
  relationship: number;
  description: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  idNumber: "",
  dateOfBirth: "",
  gender: "",
  relationship: 0,
  description: "",
};

function normalize(
  value: string | number | null | undefined
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function beneficiaryStatusLabel(
  value: number | string
): string {
  const status = normalize(value);

  if (
    status === "0" ||
    status === "alive"
  ) {
    return "Alive";
  }

  if (
    status === "1" ||
    status === "removed"
  ) {
    return "Removed";
  }

  if (
    status === "2" ||
    status === "deceased"
  ) {
    return "Deceased";
  }

  return String(value);
}

function isAlive(
  beneficiary: Beneficiary
): boolean {
  return (
    beneficiaryStatusLabel(
      beneficiary.status
    ) === "Alive"
  );
}

function isPast(
  beneficiary: Beneficiary
): boolean {
  const status =
    beneficiaryStatusLabel(
      beneficiary.status
    );

  return (
    status === "Removed" ||
    status === "Deceased"
  );
}

function relationshipLabel(
  value: number | string
): string {
  const numeric = Number(value);

  return (
    RELATIONSHIPS.find(
      (item) =>
        item.value === numeric
    )?.label || String(value)
  );
}

function requestTypeLabel(
  value: number | string
): string {
  const status = normalize(value);

  if (
    status === "0" ||
    status === "add"
  ) {
    return "Add";
  }

  if (
    status === "1" ||
    status === "remove"
  ) {
    return "Remove";
  }

  if (
    status === "2" ||
    status === "update"
  ) {
    return "Update";
  }

  return String(value);
}

function requestStatusLabel(
  value: number | string
): string {
  const status = normalize(value);

  if (
    status === "0" ||
    status === "pending"
  ) {
    return "Pending";
  }

  if (
    status === "1" ||
    status === "approved"
  ) {
    return "Approved";
  }

  if (
    status === "2" ||
    status === "rejected"
  ) {
    return "Rejected";
  }

  return String(value);
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function extractErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    data &&
    typeof data === "object" &&
    "message" in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof data === "string") {
    return data;
  }

  return fallback;
}

export default function PolicyBeneficiariesPage() {
  const params = useParams();

  const policyId =
    String(
      params.policyId || ""
    );

  const [
    currentBeneficiaries,
    setCurrentBeneficiaries,
  ] = useState<Beneficiary[]>([]);

  const [
    pastBeneficiaries,
    setPastBeneficiaries,
  ] = useState<Beneficiary[]>([]);

  const [
    requests,
    setRequests,
  ] = useState<
    BeneficiaryRequest[]
  >([]);

  const [
    policy,
    setPolicy,
  ] = useState<ClientPolicy | null>(
    null
  );

  const [
    maxBeneficiaries,
    setMaxBeneficiaries,
  ] = useState(0);

  const [
    mode,
    setMode,
  ] = useState<
    "add" | "update" | null
  >(null);

  const [
    selectedBeneficiary,
    setSelectedBeneficiary,
  ] = useState<Beneficiary | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<FormState>(
    EMPTY_FORM
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const activeBeneficiaries =
    useMemo(
      () =>
        currentBeneficiaries.filter(
          isAlive
        ),
      [currentBeneficiaries]
    );

  const pastBeneficiaryList =
    useMemo(() => {
      const combined = [
        ...pastBeneficiaries,
        ...currentBeneficiaries.filter(
          isPast
        ),
      ];

      const unique =
        new Map<
          string,
          Beneficiary
        >();

      for (const beneficiary of combined) {
        unique.set(
          beneficiary.beneficiaryId,
          beneficiary
        );
      }

      return Array.from(
        unique.values()
      );
    }, [
      currentBeneficiaries,
      pastBeneficiaries,
    ]);

  const pendingAddRequests =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            requestTypeLabel(
              request.requestType
            ) === "Add" &&
            requestStatusLabel(
              request.status
            ) === "Pending"
        ).length,
      [requests]
    );

  const usedSlots =
    activeBeneficiaries.length;

  const availableSlots =
    maxBeneficiaries > 0
      ? Math.max(
          maxBeneficiaries -
            usedSlots,
          0
        )
      : 0;

  const reservedSlots =
    maxBeneficiaries > 0
      ? Math.max(
          maxBeneficiaries -
            usedSlots -
            pendingAddRequests,
          0
        )
      : 0;

  async function loadPolicy(
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/Policy/client`,
      {
        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

    const data =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(
          data,
          "Unable to load policy."
        )
      );
    }

    const policies: ClientPolicy[] =
      Array.isArray(data)
        ? data
        : [];

    const currentPolicy =
      policies.find(
        (item) =>
          item.policyId ===
          policyId
      );

    if (!currentPolicy) {
      throw new Error(
        "Policy could not be found."
      );
    }

    setPolicy(currentPolicy);

    if (
      currentPolicy.package &&
      Number.isFinite(
        Number(
          currentPolicy.package
            .maxBeneficiaries
        )
      )
    ) {
      setMaxBeneficiaries(
        Number(
          currentPolicy.package
            .maxBeneficiaries
        )
      );

      return;
    }

    if (!currentPolicy.packageId) {
      setMaxBeneficiaries(0);
      return;
    }

    const packageResponse =
      await fetch(
        `${API_URL}/Package/${currentPolicy.packageId}`,
        {
          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          cache: "no-store",
        }
      );

    if (!packageResponse.ok) {
      setMaxBeneficiaries(0);
      return;
    }

    const packageData =
      await packageResponse
        .json()
        .catch(() => null);

    const maximum =
      Number(
        packageData?.maxBeneficiaries
      );

    setMaxBeneficiaries(
      Number.isFinite(maximum)
        ? maximum
        : 0
    );
  }

  async function loadCurrentBeneficiaries(
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/Beneficiary/client/policy/${policyId}`,
      {
        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

    const data =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(
          data,
          "Unable to load beneficiaries."
        )
      );
    }

    const beneficiaries:
      Beneficiary[] =
      Array.isArray(data)
        ? data
        : [];

    setCurrentBeneficiaries(
      beneficiaries
    );
  }

  async function loadPastBeneficiaries(
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/Beneficiary/client/policy/${policyId}/past`,
      {
        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

    if (!response.ok) {
      setPastBeneficiaries([]);
      return;
    }

    const data =
      await response
        .json()
        .catch(() => []);

    const beneficiaries:
      Beneficiary[] =
      Array.isArray(data)
        ? data
        : [];

    setPastBeneficiaries(
      beneficiaries.filter(
        isPast
      )
    );
  }

  async function loadRequests(
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_URL}/BeneficiaryRequest/client/policy/${policyId}`,
      {
        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

    if (!response.ok) {
      setRequests([]);
      return;
    }

    const data =
      await response
        .json()
        .catch(() => []);

    setRequests(
      Array.isArray(data)
        ? data
        : []
    );
  }

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      await Promise.all([
        loadPolicy(token),

        loadCurrentBeneficiaries(
          token
        ),

        loadPastBeneficiaries(
          token
        ),

        loadRequests(token),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load beneficiaries."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!policyId) {
      return;
    }

    void loadData();
  }, [policyId]);

  function beginAdd(): void {
    if (
      maxBeneficiaries > 0 &&
      usedSlots +
        pendingAddRequests >=
        maxBeneficiaries
    ) {
      setError(
        "There are no beneficiary slots available after pending requests."
      );

      return;
    }

    setSelectedBeneficiary(
      null
    );

    setForm(
      EMPTY_FORM
    );

    setMode(
      "add"
    );

    setError("");
    setSuccess("");
  }

  function beginUpdate(
    beneficiary: Beneficiary
  ): void {
    if (!isAlive(beneficiary)) {
      setError(
        "Only active beneficiaries can be updated."
      );

      return;
    }

    setSelectedBeneficiary(
      beneficiary
    );

    setForm({
      fullName:
        beneficiary.fullName,

      idNumber:
        beneficiary.idNumber,

      dateOfBirth:
        beneficiary.dateOfBirth
          ? beneficiary.dateOfBirth.slice(
              0,
              10
            )
          : "",

      gender:
        beneficiary.gender,

      relationship:
        Number(
          beneficiary.relationship
        ) || 0,

      description: "",
    });

    setMode(
      "update"
    );

    setError("");
    setSuccess("");
  }

  async function submitRequest(
    event: FormEvent
  ): Promise<void> {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      if (
        mode === "add" &&
        maxBeneficiaries > 0 &&
        usedSlots +
          pendingAddRequests >=
          maxBeneficiaries
      ) {
        throw new Error(
          "There are no beneficiary slots available."
        );
      }

      if (
        mode === "update" &&
        !selectedBeneficiary
      ) {
        throw new Error(
          "Select a beneficiary to update."
        );
      }

      const requestType =
        mode === "add"
          ? 0
          : 2;

      const response =
        await fetch(
          `${API_URL}/BeneficiaryRequest`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              policyId,
              requestType,

              beneficiaryId:
                mode === "update"
                  ? selectedBeneficiary
                      ?.beneficiaryId
                  : null,

              fullName:
                form.fullName.trim(),

              idNumber:
                form.idNumber.trim(),

              dateOfBirth:
                form.dateOfBirth,

              gender:
                form.gender,

              relationship:
                form.relationship,

              description:
                form.description.trim(),
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(
            data,
            "Unable to submit beneficiary request."
          )
        );
      }

      setMode(null);

      setSelectedBeneficiary(
        null
      );

      setForm(
        EMPTY_FORM
      );

      setSuccess(
        mode === "add"
          ? "Add beneficiary request submitted for Clerk approval."
          : "Update beneficiary request submitted for Clerk approval."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function requestRemoval(
    beneficiary: Beneficiary
  ): Promise<void> {
    if (!isAlive(beneficiary)) {
      setError(
        "Only active beneficiaries can be removed."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Submit a removal request for ${beneficiary.fullName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response =
        await fetch(
          `${API_URL}/BeneficiaryRequest`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              policyId,

              requestType: 1,

              beneficiaryId:
                beneficiary.beneficiaryId,

              description:
                `Request removal of ${beneficiary.fullName}`,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(
            data,
            "Unable to submit removal request."
          )
        );
      }

      setSuccess(
        "Removal request submitted for Clerk approval."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit removal request."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/client/policies/${policyId}`}
            className="text-sm font-medium text-teal-600"
          >
            ← Policy
          </Link>

          <h1 className="mt-3 text-2xl font-semibold">
            Manage Beneficiaries
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Policy {policyId}
          </p>

          {(policy?.package?.name ||
            policy?.packageName) && (
            <p className="mt-1 text-sm text-gray-500">
              Package:{" "}
              {policy.package?.name ||
                policy.packageName}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={beginAdd}
          disabled={
            maxBeneficiaries > 0 &&
            usedSlots +
              pendingAddRequests >=
              maxBeneficiaries
          }
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          + Add Beneficiary
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Beneficiary Slots
          </p>

          <p className="mt-2 text-3xl font-bold">
            {maxBeneficiaries > 0
              ? `${usedSlots} / ${maxBeneficiaries}`
              : usedSlots}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Alive beneficiaries only
          </p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <p className="text-sm text-teal-700">
            Available Slots
          </p>

          <p className="mt-2 text-3xl font-bold text-teal-900">
            {maxBeneficiaries > 0
              ? availableSlots
              : "—"}
          </p>

          <p className="mt-1 text-xs text-teal-700">
            {pendingAddRequests > 0
              ? `${reservedSlots} available after pending requests`
              : "Removed and deceased beneficiaries use no slots"}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">
            Pending Add Requests
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-900">
            {pendingAddRequests}
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Awaiting Clerk approval
          </p>
        </div>
      </section>

      {mode && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">
            {mode === "add"
              ? "Add Beneficiary"
              : "Update Beneficiary"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            This change will be sent to a Clerk for approval.
          </p>

          <form
            onSubmit={(event) =>
              void submitRequest(
                event
              )
            }
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <input
              required
              value={form.fullName}
              placeholder="Full name"
              onChange={(event) =>
                setForm({
                  ...form,
                  fullName:
                    event.target.value,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            <input
              required
              value={form.idNumber}
              placeholder="ID number"
              onChange={(event) =>
                setForm({
                  ...form,
                  idNumber:
                    event.target.value,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            <input
              required
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm({
                  ...form,
                  dateOfBirth:
                    event.target.value,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            <select
              required
              value={form.gender}
              onChange={(event) =>
                setForm({
                  ...form,
                  gender:
                    event.target.value,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">
                Select gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <select
              value={form.relationship}
              onChange={(event) =>
                setForm({
                  ...form,
                  relationship:
                    Number(
                      event.target.value
                    ),
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              {RELATIONSHIPS.map(
                (relationship) => (
                  <option
                    key={
                      relationship.value
                    }
                    value={
                      relationship.value
                    }
                  >
                    {
                      relationship.label
                    }
                  </option>
                )
              )}
            </select>

            <input
              value={form.description}
              placeholder="Reason / notes (optional)"
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(null);
                  setSelectedBeneficiary(
                    null
                  );
                  setForm(
                    EMPTY_FORM
                  );
                }}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="font-semibold">
            Current Beneficiaries
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Alive beneficiaries currently using package slots.
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading...
          </div>
        ) : activeBeneficiaries.length ===
          0 ? (
          <div className="p-6 text-sm text-gray-500">
            No active beneficiaries.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeBeneficiaries.map(
              (beneficiary) => (
                <article
                  key={
                    beneficiary.beneficiaryId
                  }
                  className="p-6"
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {
                          beneficiary.fullName
                        }
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {relationshipLabel(
                          beneficiary.relationship
                        )}{" "}
                        • Alive
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        ID:{" "}
                        {
                          beneficiary.idNumber
                        }
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          beginUpdate(
                            beneficiary
                          )
                        }
                        className="rounded-lg border border-teal-200 px-3 py-2 text-sm text-teal-700"
                      >
                        Request Update
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void requestRemoval(
                            beneficiary
                          )
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                      >
                        Request Removal
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="font-semibold">
            Past Beneficiaries
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Removed and deceased beneficiaries do not consume package slots.
          </p>
        </div>

        {pastBeneficiaryList.length ===
        0 ? (
          <div className="p-6 text-sm text-gray-500">
            No past beneficiaries.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pastBeneficiaryList.map(
              (beneficiary) => (
                <article
                  key={
                    beneficiary.beneficiaryId
                  }
                  className="p-6"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {
                          beneficiary.fullName
                        }
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {relationshipLabel(
                          beneficiary.relationship
                        )}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {beneficiaryStatusLabel(
                        beneficiary.status
                      )}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">
          Request History
        </h2>

        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No beneficiary requests yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map(
              (request) => (
                <div
                  key={
                    request.requestId
                  }
                  className="flex flex-wrap justify-between gap-3 rounded-xl bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {requestTypeLabel(
                        request.requestType
                      )}{" "}
                      Beneficiary
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {request.fullName ||
                        request.beneficiaryId ||
                        "Beneficiary request"}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(
                        request.requestDate
                      )}
                    </p>
                  </div>

                  <span className="text-sm font-medium">
                    {requestStatusLabel(
                      request.status
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}