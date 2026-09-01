// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/documents/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

const DOCUMENT_TYPES = [
  {
    value: "Policy Certificate",
    label: "📄 Policy Certificate",
    description:
      "Request a copy of your official policy certificate or policy schedule.",
  },
  {
    value: "Policy Statement",
    label: "📋 Policy Statement",
    description:
      "Request a current statement showing your policy details and status.",
  },
  {
    value: "Payment Statement",
    label: "💳 Payment Statement",
    description:
      "Request a record of payments made toward your policy.",
  },
  {
    value: "Payment Receipt",
    label: "🧾 Payment Receipt",
    description:
      "Request a receipt or payment confirmation.",
  },
  {
    value: "Beneficiary Record",
    label: "👨‍👩‍👧 Beneficiary Record",
    description:
      "Request a record of beneficiaries currently linked to your policy.",
  },
  {
    value: "Package Benefits Summary",
    label: "📦 Package Benefits Summary",
    description:
      "Request a document explaining your current package and its benefits.",
  },
  {
    value: "Client Verification Requirements",
    label: "✅ Client Verification Requirements",
    description:
      "Ask LegacyCare for the complete list of documents required to verify your account.",
  },
  {
    value: "Previously Uploaded Document",
    label: "📤 Previously Uploaded Document",
    description:
      "Request a copy of a document that you previously submitted to LegacyCare.",
  },
  {
    value: "Death Notification Record",
    label: "🕊️ Death Notification Record",
    description:
      "Request documentation related to a previously submitted death notification.",
  },
  {
    value: "Account Confirmation Letter",
    label: "✉️ Account Confirmation Letter",
    description:
      "Request a letter confirming your LegacyCare account or policy.",
  },
  {
    value: "Other",
    label: "📑 Other Document",
    description:
      "Request another document that is not listed above.",
  },
];

const REQUEST_REASONS = [
  "Personal records",
  "Client verification",
  "Proof of policy",
  "Payment verification",
  "Funeral administration",
  "Beneficiary administration",
  "Application or official requirement",
  "Replacement for a lost document",
  "Other",
];

const DELIVERY_METHODS = [
  "Download from LegacyCare",
  "Email",
  "Collect from branch",
];

type Branch = {
  branchId: string;
  branchName?: string | null;
  name?: string | null;
  isActive?: boolean;
};

type Policy = {
  policyId: string;
  policyNumber?: string | null;
  status?: string | number | null;

  package?: {
    name?: string | null;
  } | null;

  packageName?: string | null;
};

type PreviousUpload = {
  documentId: string;
  documentType: string;
  fileName: string;
  sourceType: string;
  sourceId: string;
  referenceNumber?: string | null;
  policyId?: string | null;
  relatedPersonName?: string | null;
  uploadedDate: string;
  downloadUrl: string;
};

type FormState = {
  branchId: string;
  policyId: string;
  documentType: string;
  previousUploadId: string;
  requestReason: string;
  deliveryMethod: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  branchId: "",
  policyId: "",
  documentType: "",
  previousUploadId: "",
  requestReason: "",
  deliveryMethod: "Download from LegacyCare",
  description: "",
};

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

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
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

function getPackageName(
  policy: Policy
): string {
  return (
    policy.package?.name ||
    policy.packageName ||
    ""
  );
}

function getPolicyLabel(
  policy: Policy
): string {
  const policyNumber =
    policy.policyNumber ||
    policy.policyId;

  const packageName =
    getPackageName(policy);

  return packageName
    ? `${policyNumber} • ${packageName}`
    : policyNumber;
}

function buildDownloadUrl(
  downloadUrl: string
): string {
  if (
    downloadUrl.startsWith(
      "http://"
    ) ||
    downloadUrl.startsWith(
      "https://"
    )
  ) {
    return downloadUrl;
  }

  const baseUrl =
    API_URL.replace(
      /\/api$/,
      ""
    );

  if (
    downloadUrl.startsWith(
      "/api/"
    )
  ) {
    return `${baseUrl}${downloadUrl}`;
  }

  return `${API_URL}/${downloadUrl.replace(
    /^\/+/,
    ""
  )}`;
}

export default function DocumentsPage() {
  const router =
    useRouter();

  const [
    branches,
    setBranches,
  ] = useState<Branch[]>([]);

  const [
    policies,
    setPolicies,
  ] = useState<Policy[]>([]);

  const [
    previousUploads,
    setPreviousUploads,
  ] = useState<
    PreviousUpload[]
  >([]);

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
    uploadHistoryWarning,
    setUploadHistoryWarning,
  ] = useState("");

  const selectedDocumentType =
    useMemo(
      () =>
        DOCUMENT_TYPES.find(
          (item) =>
            item.value ===
            form.documentType
        ) || null,
      [form.documentType]
    );

  const selectedUpload =
    useMemo(
      () =>
        previousUploads.find(
          (upload) =>
            upload.documentId ===
            form.previousUploadId
        ) || null,
      [
        previousUploads,
        form.previousUploadId,
      ]
    );

  const selectedPolicy =
    useMemo(
      () =>
        policies.find(
          (policy) =>
            policy.policyId ===
            form.policyId
        ) || null,
      [
        policies,
        form.policyId,
      ]
    );

  const requestingPreviousUpload =
    form.documentType ===
    "Previously Uploaded Document";

  const requestingVerification =
    form.documentType ===
    "Client Verification Requirements";

  useEffect(() => {
    document.title =
      "Document Request | LegacyCare";

    const loadPage =
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");
          setUploadHistoryWarning("");

          const token =
            getToken();

          if (!token) {
            throw new Error(
              "You are not logged in."
            );
          }

          const headers = {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          };

          const [
            branchResult,
            policyResult,
            uploadsResult,
          ] =
            await Promise.allSettled([
              fetch(
                `${API_URL}/Branch`,
                {
                  method:
                    "GET",

                  headers,

                  cache:
                    "no-store",
                }
              ),

              fetch(
                `${API_URL}/Policy/client`,
                {
                  method:
                    "GET",

                  headers,

                  cache:
                    "no-store",
                }
              ),

              fetch(
                `${API_URL}/Document/client/uploads`,
                {
                  method:
                    "GET",

                  headers,

                  cache:
                    "no-store",
                }
              ),
            ]);

          if (
            branchResult.status ===
            "fulfilled"
          ) {
            const response =
              branchResult.value;

            const data =
              await response
                .json()
                .catch(() => null);

            if (!response.ok) {
              throw new Error(
                extractErrorMessage(
                  data,
                  "Unable to load branches."
                )
              );
            }

            const loadedBranches:
              Branch[] =
              Array.isArray(data)
                ? data.filter(
                    (branch) =>
                      branch.isActive !==
                      false
                  )
                : [];

            setBranches(
              loadedBranches
            );

            if (
              loadedBranches.length ===
              1
            ) {
              setForm(
                (current) => ({
                  ...current,

                  branchId:
                    loadedBranches[0]
                      .branchId,
                })
              );
            }
          } else {
            throw new Error(
              "Unable to load branches."
            );
          }

          if (
            policyResult.status ===
            "fulfilled"
          ) {
            const response =
              policyResult.value;

            const data =
              await response
                .json()
                .catch(() => null);

            if (response.ok) {
              const loadedPolicies:
                Policy[] =
                Array.isArray(data)
                  ? data
                  : [];

              setPolicies(
                loadedPolicies
              );

              if (
                loadedPolicies.length ===
                1
              ) {
                setForm(
                  (current) => ({
                    ...current,

                    policyId:
                      loadedPolicies[0]
                        .policyId,
                  })
                );
              }
            } else {
              setPolicies([]);
            }
          } else {
            setPolicies([]);
          }

          if (
            uploadsResult.status ===
            "fulfilled"
          ) {
            const response =
              uploadsResult.value;

            const data =
              await response
                .json()
                .catch(() => null);

            if (response.ok) {
              setPreviousUploads(
                Array.isArray(data)
                  ? data
                  : []
              );
            } else {
              setPreviousUploads([]);

              setUploadHistoryWarning(
                extractErrorMessage(
                  data,
                  "Previously uploaded documents could not be loaded. You can still submit a normal document request."
                )
              );
            }
          } else {
            setPreviousUploads([]);

            setUploadHistoryWarning(
              "Previously uploaded documents could not be loaded. You can still submit a normal document request."
            );
          }
        } catch (err) {
          console.error(
            "[DocumentRequest] LOAD ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load document request."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPage();
  }, []);

  function handleDocumentTypeChange(
    value: string
  ): void {
    setForm(
      (current) => ({
        ...current,

        documentType:
          value,

        previousUploadId:
          "",
      })
    );
  }

  function handlePreviousUploadChange(
    documentId: string
  ): void {
    const upload =
      previousUploads.find(
        (item) =>
          item.documentId ===
          documentId
      );

    setForm(
      (current) => ({
        ...current,

        previousUploadId:
          documentId,

        policyId:
          upload?.policyId ||
          current.policyId,
      })
    );
  }

  async function handleOpenPreviousUpload(): Promise<void> {
    if (!selectedUpload) {
      return;
    }

    try {
      setError("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response =
        await fetch(
          buildDownloadUrl(
            selectedUpload.downloadUrl
          ),
          {
            method:
              "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          extractErrorMessage(
            data,
            `Unable to open document (${response.status}).`
          )
        );
      }

      const blob =
        await response.blob();

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      window.open(
        objectUrl,
        "_blank",
        "noopener,noreferrer"
      );

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            objectUrl
          );
        },
        60_000
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open the uploaded document."
      );
    }
  }

  async function handleSubmit(
    event: FormEvent
  ): Promise<void> {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!form.branchId) {
        throw new Error(
          "Please select a LegacyCare branch."
        );
      }

      if (
        !form.documentType
      ) {
        throw new Error(
          "Please select the document you need."
        );
      }

      if (
        requestingPreviousUpload &&
        !form.previousUploadId
      ) {
        throw new Error(
          "Please select the previously uploaded document you need."
        );
      }

      if (
        !form.requestReason
      ) {
        throw new Error(
          "Please select why you need the document."
        );
      }

      if (
        !form.deliveryMethod
      ) {
        throw new Error(
          "Please select how you would like to receive the document."
        );
      }

      if (
        form.documentType ===
          "Other" &&
        !form.description.trim()
      ) {
        throw new Error(
          "Please describe the document you need."
        );
      }

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const requestDetails:
        string[] = [
        `Document requested: ${form.documentType}`,
        `Reason: ${form.requestReason}`,
        `Preferred delivery: ${form.deliveryMethod}`,
      ];

      if (
        selectedPolicy
      ) {
        requestDetails.push(
          `Policy: ${selectedPolicy.policyId}`
        );

        const packageName =
          getPackageName(
            selectedPolicy
          );

        if (packageName) {
          requestDetails.push(
            `Package: ${packageName}`
          );
        }
      }

      if (
        selectedUpload
      ) {
        requestDetails.push(
          "",
          "Previously uploaded document:",
          `Document ID: ${selectedUpload.documentId}`,
          `Document type: ${selectedUpload.documentType}`,
          `File name: ${selectedUpload.fileName}`,
          `Source: ${selectedUpload.sourceType}`,
          `Source ID: ${selectedUpload.sourceId}`,
          `Reference: ${
            selectedUpload.referenceNumber ||
            "Not available"
          }`,
          `Originally uploaded: ${formatDate(
            selectedUpload.uploadedDate
          )}`
        );

        if (
          selectedUpload.policyId
        ) {
          requestDetails.push(
            `Related policy: ${selectedUpload.policyId}`
          );
        }

        if (
          selectedUpload.relatedPersonName
        ) {
          requestDetails.push(
            `Related person: ${selectedUpload.relatedPersonName}`
          );
        }
      }

      if (
        requestingVerification
      ) {
        requestDetails.push(
          "",
          "Client is requesting the complete LegacyCare client-verification document requirements and official checklist."
        );
      }

      if (
        form.description.trim()
      ) {
        requestDetails.push(
          "",
          "Client message:",
          form.description.trim()
        );
      }

      const response =
        await fetch(
          `${API_URL}/ServiceRequest`,
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                requestType:
                  "DocumentRequest",

                priority:
                  "Normal",

                acceptPriorityFee:
                  false,

                additionalFee:
                  0,

                branchId:
                  form.branchId,

                appointmentDateTime:
                  null,

                description:
                  requestDetails.join(
                    "\n"
                  ),
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
            `Unable to submit document request (${response.status}).`
          )
        );
      }

      router.push(
        "/client/service-requests?documentCreated=true"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "[DocumentRequest] SUBMIT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit document request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/client/service-requests"
          className="text-sm font-medium text-teal-600 transition hover:text-teal-700"
        >
          ← Service Requests
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-2xl">
            📑
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Request Documents
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Request records, verification information or copies of documents
              you previously submitted to LegacyCare.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-900">
          📂 What can I request?
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          You can request policy documents, payment records, beneficiary
          information, account confirmation, verification requirements and
          available copies of documents previously uploaded to LegacyCare.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {uploadHistoryWarning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {uploadHistoryWarning}
        </div>
      ) : null}

      <form
        onSubmit={(event) =>
          void handleSubmit(
            event
          )
        }
        className="space-y-6"
      >
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            1. Document Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the document or information you need.
          </p>

          <div className="mt-6">
            <label
              htmlFor="documentType"
              className="block text-sm font-medium text-gray-700"
            >
              What document do you need?
            </label>

            <select
              id="documentType"
              required
              value={
                form.documentType
              }
              onChange={(event) =>
                handleDocumentTypeChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">
                Select a document
              </option>

              {DOCUMENT_TYPES.map(
                (type) => (
                  <option
                    key={
                      type.value
                    }
                    value={
                      type.value
                    }
                  >
                    {
                      type.label
                    }
                  </option>
                )
              )}
            </select>

            {selectedDocumentType ? (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  {
                    selectedDocumentType.description
                  }
                </p>
              </div>
            ) : null}
          </div>

          {requestingPreviousUpload ? (
            <div className="mt-6">
              <label
                htmlFor="previousUpload"
                className="block text-sm font-medium text-gray-700"
              >
                Which previously uploaded document do you need?
              </label>

              <select
                id="previousUpload"
                required
                disabled={
                  loading ||
                  previousUploads.length ===
                    0
                }
                value={
                  form.previousUploadId
                }
                onChange={(event) =>
                  handlePreviousUploadChange(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
              >
                <option value="">
                  {loading
                    ? "Loading past uploads..."
                    : previousUploads.length ===
                        0
                      ? "No previous uploads available"
                      : "Select a previous upload"}
                </option>

                {previousUploads.map(
                  (upload) => (
                    <option
                      key={
                        upload.documentId
                      }
                      value={
                        upload.documentId
                      }
                    >
                      {upload.documentType}
                      {" • "}
                      {upload.fileName}
                      {upload.referenceNumber
                        ? ` • ${upload.referenceNumber}`
                        : ""}
                      {upload.uploadedDate
                        ? ` • ${formatDate(
                            upload.uploadedDate
                          )}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              {previousUploads.length ===
                0 &&
              !loading ? (
                <p className="mt-2 text-xs leading-5 text-amber-700">
                  No previously uploaded documents are currently available.
                  You can still choose another document type or select Other
                  Document and explain what you need.
                </p>
              ) : null}
            </div>
          ) : null}

          {selectedUpload ? (
            <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-teal-900">
                    📤 Selected Previous Upload
                  </p>

                  <p className="mt-1 text-xs text-teal-700">
                    This is the document that will be referenced in your request.
                  </p>
                </div>

                {selectedUpload.downloadUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      void handleOpenPreviousUpload()
                    }
                    className="rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                  >
                    Preview Document
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-teal-700">
                    Document Type
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {
                      selectedUpload.documentType
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    File Name
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {
                      selectedUpload.fileName
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Source
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {
                      selectedUpload.sourceType
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Reference
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {selectedUpload.referenceNumber ||
                      selectedUpload.sourceId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Related Policy
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {selectedUpload.policyId ||
                      "Not linked to a policy"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Originally Uploaded
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(
                      selectedUpload.uploadedDate
                    )}
                  </p>
                </div>

                {selectedUpload.relatedPersonName ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-teal-700">
                      Related Person
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {
                        selectedUpload.relatedPersonName
                      }
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <label
              htmlFor="policyId"
              className="block text-sm font-medium text-gray-700"
            >
              Related Policy
              <span className="ml-1 font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <select
              id="policyId"
              disabled={
                loading
              }
              value={
                form.policyId
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  policyId:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                No specific policy
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
                    {getPolicyLabel(
                      policy
                    )}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {requestingVerification ? (
          <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="font-semibold text-green-900">
              ✅ Client Verification Requirements
            </h2>

            <p className="mt-2 text-sm leading-6 text-green-800">
              LegacyCare will provide the official checklist needed for your
              specific account, policy or service. Requirements can differ
              depending on what needs to be verified.
            </p>

            <div className="mt-4 rounded-xl border border-green-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">
                Common verification documents may include:
              </p>

              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>
                  🪪 Identity document or another accepted form of identification
                </li>

                <li>
                  🏠 Proof of residential address where required
                </li>

                <li>
                  📄 Policy or account information
                </li>

                <li>
                  👨‍👩‍👧 Beneficiary supporting information where relevant
                </li>

                <li>
                  💳 Payment records for payment-related verification
                </li>

                <li>
                  📑 Additional supporting documents required for the specific request
                </li>
              </ul>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                The Clerk will confirm the exact official requirements for your
                case before you provide anything additional.
              </p>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            2. Request Details
          </h2>

          <div className="mt-6">
            <label
              htmlFor="requestReason"
              className="block text-sm font-medium text-gray-700"
            >
              Why do you need this document?
            </label>

            <select
              id="requestReason"
              required
              value={
                form.requestReason
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  requestReason:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">
                Select a reason
              </option>

              {REQUEST_REASONS.map(
                (reason) => (
                  <option
                    key={reason}
                    value={reason}
                  >
                    {reason}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-6">
            <label
              htmlFor="deliveryMethod"
              className="block text-sm font-medium text-gray-700"
            >
              How would you like to receive it?
            </label>

            <select
              id="deliveryMethod"
              required
              value={
                form.deliveryMethod
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  deliveryMethod:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {DELIVERY_METHODS.map(
                (method) => (
                  <option
                    key={method}
                    value={method}
                  >
                    {method}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-6">
            <label
              htmlFor="branchId"
              className="block text-sm font-medium text-gray-700"
            >
              LegacyCare Branch
            </label>

            <select
              id="branchId"
              required
              disabled={loading}
              value={
                form.branchId
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  branchId:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                {loading
                  ? "Loading branches..."
                  : "Select a branch"}
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={
                      branch.branchId
                    }
                    value={
                      branch.branchId
                    }
                  >
                    {branch.branchName ||
                      branch.name ||
                      branch.branchId}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            3. Additional Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add anything that will help the Clerk identify or prepare the
            correct document.
          </p>

          <textarea
            id="description"
            rows={7}
            maxLength={2000}
            value={
              form.description
            }
            onChange={(event) =>
              setForm({
                ...form,

                description:
                  event.target.value,
              })
            }
            placeholder="Example: I need the latest copy for my personal records. Please include the most recent version available..."
            className="mt-5 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
            <span>
              Do not include passwords, PINs or account login credentials.
            </span>

            <span>
              {
                form.description.length
              }
              /2000
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            📋 Document Request Workflow
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
              Submitted
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-purple-100 px-3 py-1.5 text-purple-700">
              Processing
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
              Ready
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1.5 text-green-700">
              Delivered
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            A document request may also be rejected or cancelled if it cannot
            be completed.
          </p>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/client/service-requests"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              loading
            }
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : "Submit Document Request"}
          </button>
        </div>
      </form>
    </div>
  );
}