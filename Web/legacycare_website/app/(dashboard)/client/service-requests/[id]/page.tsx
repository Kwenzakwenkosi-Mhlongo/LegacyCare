// File: app/(dashboard)/client/service-requests/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type Branch = {
  branchId: string;
  branchName: string;
};

type DeathNotification = {
  deathNotificationId: string;
  requestNumber?: string | null;

  policyId?: string | null;
  beneficiaryId?: string | null;

  dateOfDeath?: string | null;
  dateReported?: string | null;
  dateVerified?: string | null;

  relationshipToDeceased?: string | null;

  contactPerson?: string | null;
  contactNumber?: string | null;

  bodyLocationType?: string | null;
  bodyLocationAddress?: string | null;

  mortuaryName?: string | null;

  storageId?: string | null;
  storageUnitNumber?: string | null;

  collectionDate?: string | null;
  collectionNotes?: string | null;

  documentFileName?: string | null;

  status?: string | null;

  rejectionReason?: string | null;

  branchId?: string | null;

  documentUrl?: string | null;

  beneficiary?: {
    beneficiaryId?: string | null;
    fullName?: string | null;
    idNumber?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    relationship?: string | null;
    status?: string | null;
  } | null;

  policy?: {
    policyId?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  } | null;

  branch?: {
    branchId?: string | null;
    branchName?: string | null;
    address?: string | null;
    contactNo?: string | null;
    email?: string | null;
  } | null;

  verifiedByUser?: {
    userId?: string | null;
    fullName?: string | null;
    email?: string | null;
  } | null;
};

type ServiceRequest = {
  serviceRequestId: number;
  clientId: string | number;

  requestType: string;
  status: string;
  priority: string;

  description?: string | null;

  branchId?: string | null;

  deathNotificationId?: string | null;
  deathNotification?: DeathNotification | null;

  assignedStaffId?: string | number | null;

  createdDate: string;
  updatedDate?: string | null;
  dueDate?: string | null;

  appointmentDateTime?: string | null;

  additionalFee?: number | null;
};

type AppointmentDetails = {
  appointmentId: number;
  serviceRequestId: number;

  clientId: string;
  branchId: string;

  appointmentType: string;

  preferredDateTime: string;
  confirmedDateTime?: string | null;

  status: string;
  priority: string;

  clientNotes?: string | null;
  clerkNotes?: string | null;

  assignedStaffId?: string | null;

  rescheduleReason?: string | null;
  cancellationReason?: string | null;

  createdDate: string;
  updatedDate: string;

  confirmedDate?: string | null;
  completedDate?: string | null;
  cancelledDate?: string | null;

  assignedStaff?: {
    staffId?: string | null;
    staffRole?: string | null;

    user?: {
      userId?: string | null;
      fullName?: string | null;
      email?: string | null;
    } | null;
  } | null;

  branch?: {
    branchId?: string | null;
    branchName?: string | null;
  } | null;
};

type DetailItemProps = {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;
};

function getRequestIcon(
  requestType: string
) {
  const type =
    (requestType || "")
      .trim()
      .toLowerCase();

  if (type.includes("appointment")) {
    return "📅";
  }

  if (type.includes("funeral")) {
    return "🕊️";
  }

  if (type.includes("death")) {
    return "🕊️";
  }

  if (type.includes("quote")) {
    return "💰";
  }

  if (type.includes("beneficiary")) {
    return "👨‍👩‍👧";
  }

  if (type.includes("policy")) {
    return "📄";
  }

  if (type.includes("payment")) {
    return "💳";
  }

  if (type.includes("document")) {
    return "📑";
  }

  if (type.includes("support")) {
    return "💬";
  }

  return "📋";
}

function getStatusStyle(
  status: string
) {
  switch (
    (status || "")
      .trim()
      .toLowerCase()
  ) {
    case "requested":
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";

    case "confirmed":
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";

    case "rescheduled":
    case "in progress":
      return "bg-purple-100 text-purple-700 border-purple-200";

    case "completed":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";

    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";

    case "noshow":
    case "no show":
      return "bg-orange-100 text-orange-700 border-orange-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatStatus(
  status?: string | null
) {
  if (!status) {
    return "Not available";
  }

  if (
    status
      .trim()
      .toLowerCase() ===
    "noshow"
  ) {
    return "No Show";
  }

  return status;
}

function formatDate(
  date?: string | null
) {
  if (!date) {
    return "Not available";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatTime(
  date?: string | null
) {
  if (!date) {
    return "Not available";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Not available";
  }

  return parsedDate.toLocaleTimeString(
    "en-ZA",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatDateTime(
  date?: string | null
) {
  if (!date) {
    return "Not available";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Not available";
  }

  return parsedDate.toLocaleString(
    "en-ZA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function valueOrNotAvailable(
  value?: string | null
) {
  if (
    !value ||
    !value.trim()
  ) {
    return "Not available";
  }

  return value;
}

function isAppointmentRequest(
  requestType: string
) {
  const type =
    (requestType || "")
      .trim()
      .toLowerCase();

  return (
    type === "appointment" ||
    type === "appointment request"
  );
}

function isFuneralRequest(
  requestType: string
) {
  const type =
    (requestType || "")
      .trim()
      .toLowerCase();

  return (
    type === "funeral" ||
    type === "funeral service" ||
    type === "funeral request" ||
    type === "funeralservice"
  );
}

function isDeathRequest(
  requestType: string
) {
  return (
    requestType || ""
  )
    .trim()
    .toLowerCase()
    .includes("death");
}

function canEditAppointment(
  request: ServiceRequest,
  appointment?: AppointmentDetails | null
) {
  if (
    !isAppointmentRequest(
      request.requestType
    )
  ) {
    return false;
  }

  const status =
    (
      appointment?.status ||
      request.status ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "noshow" ||
    status === "no show"
  ) {
    return false;
  }

  const scheduledDateTime =
    appointment?.confirmedDateTime ||
    appointment?.preferredDateTime ||
    request.appointmentDateTime;

  if (!scheduledDateTime) {
    return false;
  }

  const scheduledTime =
    new Date(
      scheduledDateTime
    ).getTime();

  if (
    Number.isNaN(
      scheduledTime
    )
  ) {
    return false;
  }

  const hoursRemaining =
    (
      scheduledTime -
      Date.now()
    ) /
    (
      1000 *
      60 *
      60
    );

  return hoursRemaining > 24;
}

function canEditFuneral(
  request: ServiceRequest
) {
  if (
    !isFuneralRequest(
      request.requestType
    )
  ) {
    return false;
  }

  if (
    !request.appointmentDateTime
  ) {
    return false;
  }

  const status =
    (request.status || "")
      .trim()
      .toLowerCase();

  if (
    status === "completed" ||
    status === "rejected" ||
    status === "cancelled"
  ) {
    return false;
  }

  const funeralTime =
    new Date(
      request.appointmentDateTime
    ).getTime();

  if (
    Number.isNaN(
      funeralTime
    )
  ) {
    return false;
  }

  const hoursRemaining =
    (
      funeralTime -
      Date.now()
    ) /
    (
      1000 *
      60 *
      60
    );

  return hoursRemaining > 24;
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  const displayValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "Not available"
      : String(value);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words font-medium text-gray-900">
        {displayValue}
      </p>
    </div>
  );
}

export default function ServiceRequestDetailsPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const rawId =
    params?.id;

  const id =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  const [
    request,
    setRequest,
  ] =
    useState<
      ServiceRequest | null
    >(null);

  const [
    appointment,
    setAppointment,
  ] =
    useState<
      AppointmentDetails | null
    >(null);

  const [
    branches,
    setBranches,
  ] =
    useState<Branch[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingBranches,
    setLoadingBranches,
  ] =
    useState(true);

  const [
    loadingAppointment,
    setLoadingAppointment,
  ] =
    useState(false);

  const [
    openingDocument,
    setOpeningDocument,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    appointmentError,
    setAppointmentError,
  ] =
    useState("");

  const [
    documentError,
    setDocumentError,
  ] =
    useState("");

  useEffect(() => {
    const loadBranches =
      async () => {
        try {
          setLoadingBranches(
            true
          );

          const token =
            getToken();

          if (!token) {
            return;
          }

          const response =
            await fetch(
              `${API_URL}/Branch`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Unable to load branches (${response.status}).`
            );
          }

          setBranches(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (err) {
          console.error(
            "[ServiceRequestDetails] Branch error:",
            err
          );

          setBranches([]);
        } finally {
          setLoadingBranches(
            false
          );
        }
      };

    void loadBranches();
  }, []);

  useEffect(() => {
    const loadRequest =
      async () => {
        try {
          setLoading(true);
          setError("");

          const token =
            getToken();

          if (!token) {
            setError(
              "You are not logged in."
            );

            return;
          }

          if (!id) {
            setError(
              "Service request ID is missing."
            );

            return;
          }

          const response =
            await fetch(
              `${API_URL}/ServiceRequest/${id}`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Unable to load service request (${response.status}).`
            );
          }

          setRequest(
            data as ServiceRequest
          );
        } catch (err) {
          console.error(
            "[ServiceRequestDetails] Error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load service request."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadRequest();
  }, [id]);

  useEffect(() => {
    if (
      !request ||
      !isAppointmentRequest(
        request.requestType
      )
    ) {
      setAppointment(null);
      setAppointmentError("");
      setLoadingAppointment(false);

      return;
    }

    const loadAppointment =
      async () => {
        try {
          setLoadingAppointment(
            true
          );

          setAppointmentError("");

          const token =
            getToken();

          if (!token) {
            setAppointmentError(
              "You are not logged in."
            );

            return;
          }

          const response =
            await fetch(
              `${API_URL}/Appointment/my/by-service-request/${request.serviceRequestId}`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Unable to load appointment (${response.status}).`
            );
          }

          setAppointment(
            data as AppointmentDetails
          );
        } catch (err) {
          console.error(
            "[ServiceRequestDetails] Appointment error:",
            err
          );

          setAppointmentError(
            err instanceof Error
              ? err.message
              : "Unable to load appointment details."
          );
        } finally {
          setLoadingAppointment(
            false
          );
        }
      };

    void loadAppointment();
  }, [request]);

  const getBranchDetails =
    (
      branchId?: string | null
    ) => {
      if (!branchId) {
        return null;
      }

      const normalizedId =
        String(branchId)
          .trim()
          .toLowerCase();

      return (
        branches.find(
          (branch) =>
            String(
              branch.branchId
            )
              .trim()
              .toLowerCase() ===
            normalizedId
        ) || null
      );
    };

  const handleViewDocument =
    async () => {
      const deathNotification =
        request?.deathNotification;

      if (!deathNotification) {
        setDocumentError(
          "Death notification details are unavailable."
        );

        return;
      }

      let documentWindow:
        | Window
        | null =
        null;

      try {
        setOpeningDocument(
          true
        );

        setDocumentError("");

        const token =
          getToken();

        if (!token) {
          setDocumentError(
            "You are not logged in."
          );

          return;
        }

        documentWindow =
          window.open(
            "",
            "_blank"
          );

        if (!documentWindow) {
          setDocumentError(
            "The browser blocked the document window. Please allow pop-ups for this website."
          );

          return;
        }

        documentWindow.document.write(`
          <!doctype html>
          <html>
            <head>
              <title>Loading document...</title>
            </head>
            <body
              style="
                font-family: Arial, sans-serif;
                background: #f9fafb;
                padding: 40px;
                text-align: center;
              "
            >
              <h2>Loading Proof of Death</h2>
              <p>Please wait...</p>
            </body>
          </html>
        `);

        documentWindow.document.close();

        const response =
          await fetch(
            `${API_URL}/DeathNotification/${deathNotification.deathNotificationId}/document`,
            {
              method: "GET",

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
              .catch(
                () => null
              );

          throw new Error(
            data?.message ||
              `Unable to open document (${response.status}).`
          );
        }

        const blob =
          await response.blob();

        if (blob.size === 0) {
          throw new Error(
            "The returned document is empty."
          );
        }

        const blobUrl =
          URL.createObjectURL(
            blob
          );

        documentWindow.location.href =
          blobUrl;

        window.setTimeout(
          () => {
            URL.revokeObjectURL(
              blobUrl
            );
          },
          60000
        );
      } catch (err) {
        if (
          documentWindow &&
          !documentWindow.closed
        ) {
          documentWindow.close();
        }

        setDocumentError(
          err instanceof Error
            ? err.message
            : "Unable to open proof of death document."
        );
      } finally {
        setOpeningDocument(
          false
        );
      }
    };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-64 rounded bg-gray-200" />

          <div className="mt-6 h-48 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (
    error ||
    !request
  ) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests"
            )
          }
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error ||
            "Request not found."}
        </div>
      </div>
    );
  }

  const branch =
    getBranchDetails(
      request.branchId
    );

  const deathNotification =
    request.deathNotification;

  const effectiveStatus =
    isAppointmentRequest(
      request.requestType
    ) &&
    appointment
      ? appointment.status
      : request.status;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() =>
          router.push(
            "/client/service-requests"
          )
        }
        className="text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        ← Back to Service Requests
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-3xl">
              {getRequestIcon(
                request.requestType
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Service Request
              </p>

              <h1 className="text-2xl font-semibold text-gray-900">
                REQ-
                {String(
                  request.serviceRequestId
                ).padStart(
                  5,
                  "0"
                )}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {request.requestType}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
              effectiveStatus
            )}`}
          >
            {formatStatus(
              effectiveStatus
            )}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Request Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            General information about this service request.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Request Type"
            value={
              request.requestType
            }
          />

          <DetailItem
            label="Status"
            value={
              formatStatus(
                effectiveStatus
              )
            }
          />

          <DetailItem
            label="Priority"
            value={
              appointment?.priority ||
              request.priority
            }
          />

          <DetailItem
            label="Branch"
            value={
              appointment?.branch
                ?.branchName ||
              branch?.branchName ||
              (
                loadingBranches
                  ? "Loading..."
                  : appointment?.branchId ||
                    request.branchId
              )
            }
          />

          <DetailItem
            label="Submitted"
            value={
              formatDateTime(
                appointment?.createdDate ||
                request.createdDate
              )
            }
          />

          <DetailItem
            label="Last Updated"
            value={
              formatDateTime(
                appointment?.updatedDate ||
                request.updatedDate
              )
            }
          />

          {request.dueDate &&
            !isAppointmentRequest(
              request.requestType
            ) && (
              <DetailItem
                label="Due Date"
                value={
                  formatDateTime(
                    request.dueDate
                  )
                }
              />
            )}

          {request.additionalFee !==
            null &&
            request.additionalFee !==
              undefined &&
            request.additionalFee >
              0 && (
              <DetailItem
                label="Additional Fee"
                value={`R${request.additionalFee.toFixed(
                  2
                )}`}
              />
            )}
        </div>
      </div>

      {!isAppointmentRequest(
        request.requestType
      ) &&
        request.description && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Request Description
              </h2>
            </div>

            <div className="p-6">
              <div className="whitespace-pre-line rounded-xl bg-gray-50 p-5 text-sm leading-7 text-gray-700">
                {request.description}
              </div>
            </div>
          </div>
        )}

      {isAppointmentRequest(
        request.requestType
      ) && (
        <div className="space-y-6">
          {loadingAppointment && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-48 rounded bg-gray-200" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="h-16 rounded-xl bg-gray-200" />
                  <div className="h-16 rounded-xl bg-gray-200" />
                  <div className="h-16 rounded-xl bg-gray-200" />
                  <div className="h-16 rounded-xl bg-gray-200" />
                </div>
              </div>
            </div>
          )}

          {!loadingAppointment &&
            appointmentError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-900">
                  Appointment details unavailable
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  {appointmentError}
                </p>
              </div>
            )}

          {!loadingAppointment &&
            appointment && (
              <>
                <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
                  <div className="border-b border-teal-100 bg-teal-50 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-teal-900">
                          Appointment Details
                        </h2>

                        <p className="mt-1 text-sm text-teal-700">
                          Current appointment information from LegacyCare.
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                          appointment.status
                        )}`}
                      >
                        {formatStatus(
                          appointment.status
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem
                      label="Appointment Type"
                      value={
                        appointment.appointmentType
                      }
                    />

                    <DetailItem
                      label="Status"
                      value={
                        formatStatus(
                          appointment.status
                        )
                      }
                    />

                    <DetailItem
                      label="Priority"
                      value={
                        appointment.priority
                      }
                    />

                    <DetailItem
                      label="Preferred Date"
                      value={
                        formatDate(
                          appointment.preferredDateTime
                        )
                      }
                    />

                    <DetailItem
                      label="Preferred Time"
                      value={
                        formatTime(
                          appointment.preferredDateTime
                        )
                      }
                    />

                    <DetailItem
                      label="Branch"
                      value={
                        appointment.branch
                          ?.branchName ||
                        branch
                          ?.branchName ||
                        appointment.branchId
                      }
                    />

                    {appointment.confirmedDateTime && (
                      <>
                        <DetailItem
                          label={
                            appointment.status
                              .toLowerCase() ===
                            "rescheduled"
                              ? "Rescheduled Date"
                              : "Confirmed Date"
                          }
                          value={
                            formatDate(
                              appointment.confirmedDateTime
                            )
                          }
                        />

                        <DetailItem
                          label={
                            appointment.status
                              .toLowerCase() ===
                            "rescheduled"
                              ? "Rescheduled Time"
                              : "Confirmed Time"
                          }
                          value={
                            formatTime(
                              appointment.confirmedDateTime
                            )
                          }
                        />
                      </>
                    )}

                    <DetailItem
                      label="Assigned Staff"
                      value={
                        appointment
                          .assignedStaff
                          ?.user
                          ?.fullName ||
                        appointment.assignedStaffId ||
                        "Not assigned yet"
                      }
                    />

                    {appointment
                      .assignedStaff
                      ?.staffRole && (
                      <DetailItem
                        label="Staff Role"
                        value={
                          appointment
                            .assignedStaff
                            .staffRole
                        }
                      />
                    )}

                    <DetailItem
                      label="Submitted"
                      value={
                        formatDateTime(
                          appointment.createdDate
                        )
                      }
                    />

                    <DetailItem
                      label="Last Updated"
                      value={
                        formatDateTime(
                          appointment.updatedDate
                        )
                      }
                    />

                    {appointment.confirmedDate && (
                      <DetailItem
                        label="Confirmed On"
                        value={
                          formatDateTime(
                            appointment.confirmedDate
                          )
                        }
                      />
                    )}

                    {appointment.completedDate && (
                      <DetailItem
                        label="Completed On"
                        value={
                          formatDateTime(
                            appointment.completedDate
                          )
                        }
                      />
                    )}

                    {appointment.cancelledDate && (
                      <DetailItem
                        label="Cancelled On"
                        value={
                          formatDateTime(
                            appointment.cancelledDate
                          )
                        }
                      />
                    )}
                  </div>
                </div>

                {appointment.clientNotes && (
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Your Notes
                      </h2>
                    </div>

                    <div className="p-6">
                      <div className="whitespace-pre-line rounded-xl bg-gray-50 p-5 text-sm leading-7 text-gray-700">
                        {appointment.clientNotes}
                      </div>
                    </div>
                  </div>
                )}

                {(appointment.clerkNotes ||
                  appointment.rescheduleReason ||
                  appointment.cancellationReason) && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                    <h2 className="font-semibold text-blue-900">
                      LegacyCare Update
                    </h2>

                    {appointment.clerkNotes && (
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                          Clerk Notes
                        </p>

                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-blue-900">
                          {appointment.clerkNotes}
                        </p>
                      </div>
                    )}

                    {appointment.rescheduleReason && (
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                          Reschedule Reason
                        </p>

                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-blue-900">
                          {appointment.rescheduleReason}
                        </p>
                      </div>
                    )}

                    {appointment.cancellationReason && (
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                          Cancellation Reason
                        </p>

                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-blue-900">
                          {appointment.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`rounded-2xl border p-5 ${
                    canEditAppointment(
                      request,
                      appointment
                    )
                      ? "border-teal-200 bg-teal-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {canEditAppointment(
                        request,
                        appointment
                      )
                        ? "✏️"
                        : "🔒"}
                    </div>

                    <div>
                      <h2
                        className={`font-semibold ${
                          canEditAppointment(
                            request,
                            appointment
                          )
                            ? "text-teal-900"
                            : "text-gray-800"
                        }`}
                      >
                        {canEditAppointment(
                          request,
                          appointment
                        )
                          ? "Appointment can be edited"
                          : "Appointment editing unavailable"}
                      </h2>

                      <p
                        className={`mt-1 text-sm leading-6 ${
                          canEditAppointment(
                            request,
                            appointment
                          )
                            ? "text-teal-800"
                            : "text-gray-600"
                        }`}
                      >
                        {canEditAppointment(
                          request,
                          appointment
                        )
                          ? "You may change this appointment while more than 24 hours remain. Changing the preferred date or branch sends it back to LegacyCare for confirmation."
                          : "Editing is unavailable because the appointment is closed or 24 hours or less remain before the scheduled time."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
      )}

      {isDeathRequest(
        request.requestType
      ) && (
        <div className="space-y-6">
          {!request.deathNotificationId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-semibold text-amber-900">
                Death notification details unavailable
              </p>

              <p className="mt-1 text-sm text-amber-800">
                This service request is not linked to a death notification.
              </p>
            </div>
          )}

          {request.deathNotificationId &&
            !deathNotification && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-semibold text-amber-900">
                  Linked death notification could not be loaded
                </p>
              </div>
            )}

          {deathNotification && (
            <>
              <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
                <div className="border-b border-teal-100 bg-teal-50 p-6">
                  <h2 className="text-lg font-semibold text-teal-900">
                    Death Notification Submitted
                  </h2>

                  <p className="mt-1 text-sm text-teal-700">
                    Information you submitted to LegacyCare.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Death Request Number"
                    value={
                      deathNotification.requestNumber
                    }
                  />

                  <DetailItem
                    label="Beneficiary"
                    value={
                      deathNotification
                        .beneficiary
                        ?.fullName
                    }
                  />

                  <DetailItem
                    label="Beneficiary ID"
                    value={
                      deathNotification.beneficiaryId
                    }
                  />

                  <DetailItem
                    label="Policy Number"
                    value={
                      deathNotification.policyId
                    }
                  />

                  <DetailItem
                    label="Date of Death"
                    value={
                      formatDate(
                        deathNotification.dateOfDeath
                      )
                    }
                  />

                  <DetailItem
                    label="Date Reported"
                    value={
                      formatDateTime(
                        deathNotification.dateReported
                      )
                    }
                  />

                  <DetailItem
                    label="Relationship to Deceased"
                    value={
                      deathNotification.relationshipToDeceased
                    }
                  />

                  <DetailItem
                    label="Contact Person"
                    value={
                      deathNotification.contactPerson
                    }
                  />

                  <DetailItem
                    label="Contact Number"
                    value={
                      deathNotification.contactNumber
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Beneficiary Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Full Name"
                    value={
                      deathNotification
                        .beneficiary
                        ?.fullName
                    }
                  />

                  <DetailItem
                    label="Beneficiary Number"
                    value={
                      deathNotification
                        .beneficiary
                        ?.beneficiaryId
                    }
                  />

                  <DetailItem
                    label="ID Number"
                    value={
                      deathNotification
                        .beneficiary
                        ?.idNumber
                    }
                  />

                  <DetailItem
                    label="Date of Birth"
                    value={
                      formatDate(
                        deathNotification
                          .beneficiary
                          ?.dateOfBirth
                      )
                    }
                  />

                  <DetailItem
                    label="Gender"
                    value={
                      deathNotification
                        .beneficiary
                        ?.gender
                    }
                  />

                  <DetailItem
                    label="Policy Relationship"
                    value={
                      deathNotification
                        .beneficiary
                        ?.relationship
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Policy Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Policy Number"
                    value={
                      deathNotification
                        .policy
                        ?.policyId ||
                      deathNotification.policyId
                    }
                  />

                  <DetailItem
                    label="Policy Status"
                    value={
                      deathNotification
                        .policy
                        ?.status
                    }
                  />

                  <DetailItem
                    label="Policy Start Date"
                    value={
                      formatDate(
                        deathNotification
                          .policy
                          ?.startDate
                      )
                    }
                  />

                  {deathNotification
                    .policy
                    ?.endDate && (
                    <DetailItem
                      label="Policy End Date"
                      value={
                        formatDate(
                          deathNotification
                            .policy
                            ?.endDate
                        )
                      }
                    />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Body Location
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Location information and LegacyCare collection details.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Location Type"
                    value={
                      deathNotification.bodyLocationType
                    }
                  />

                  <DetailItem
                    label="Location / Address"
                    value={
                      deathNotification.bodyLocationAddress
                    }
                  />

                  <DetailItem
                    label="Mortuary"
                    value={
                      deathNotification.mortuaryName
                    }
                  />

                  <DetailItem
                    label="Storage Unit"
                    value={
                      deathNotification.storageUnitNumber
                    }
                  />

                  <DetailItem
                    label="Collection Date"
                    value={
                      deathNotification.collectionDate
                        ? formatDateTime(
                            deathNotification.collectionDate
                          )
                        : "Not collected yet"
                    }
                  />

                  <DetailItem
                    label="Collection Notes"
                    value={
                      deathNotification.collectionNotes
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    LegacyCare Branch
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Branch"
                    value={
                      deathNotification
                        .branch
                        ?.branchName
                    }
                  />

                  <DetailItem
                    label="Branch Number"
                    value={
                      deathNotification
                        .branch
                        ?.branchId ||
                      deathNotification.branchId
                    }
                  />

                  <DetailItem
                    label="Address"
                    value={
                      deathNotification
                        .branch
                        ?.address
                    }
                  />

                  <DetailItem
                    label="Contact Number"
                    value={
                      deathNotification
                        .branch
                        ?.contactNo
                    }
                  />

                  <DetailItem
                    label="Email"
                    value={
                      deathNotification
                        .branch
                        ?.email
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Proof of Death
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    The document submitted with this death notification.
                  </p>
                </div>

                <div className="p-6">
                  <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                        📄
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {valueOrNotAvailable(
                            deathNotification.documentFileName
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Submitted proof-of-death document
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        openingDocument ||
                        !deathNotification.deathNotificationId
                      }
                      onClick={() =>
                        void handleViewDocument()
                      }
                      className="shrink-0 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {openingDocument
                        ? "Opening..."
                        : "👁 View Document"}
                    </button>
                  </div>

                  {documentError && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {documentError}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Review Status
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="Notification Status"
                    value={
                      deathNotification.status
                    }
                  />

                  <DetailItem
                    label="Verified By"
                    value={
                      deathNotification
                        .verifiedByUser
                        ?.fullName ||
                      "Not verified yet"
                    }
                  />

                  <DetailItem
                    label="Date Verified"
                    value={
                      deathNotification.dateVerified
                        ? formatDateTime(
                            deathNotification.dateVerified
                          )
                        : "Not verified yet"
                    }
                  />

                  {deathNotification.rejectionReason && (
                    <DetailItem
                      label="Rejection Reason"
                      value={
                        deathNotification.rejectionReason
                      }
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {isFuneralRequest(
        request.requestType
      ) &&
        request.appointmentDateTime && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Funeral Details
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
              <DetailItem
                label="Funeral Date"
                value={
                  formatDate(
                    request.appointmentDateTime
                  )
                }
              />

              <DetailItem
                label="Funeral Time"
                value={
                  formatTime(
                    request.appointmentDateTime
                  )
                }
              />
            </div>
          </div>
        )}

      {isAppointmentRequest(
        request.requestType
      ) &&
        appointment && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="font-semibold text-blue-900">
              What happens next?
            </h2>

            {appointment.status
              .toLowerCase() ===
              "requested" && (
              <p className="mt-2 text-sm leading-6 text-blue-800">
                Your appointment request has been received. A LegacyCare Clerk at your selected branch will review your preferred date and time.
              </p>
            )}

            {appointment.status
              .toLowerCase() ===
              "confirmed" && (
              <p className="mt-2 text-sm leading-6 text-blue-800">
                Your appointment has been confirmed. Please attend the selected branch at the confirmed date and time shown above.
              </p>
            )}

            {appointment.status
              .toLowerCase() ===
              "rescheduled" && (
              <p className="mt-2 text-sm leading-6 text-blue-800">
                LegacyCare has rescheduled your appointment. Review the new date, time and reschedule reason above.
              </p>
            )}

            {appointment.status
              .toLowerCase() ===
              "completed" && (
              <p className="mt-2 text-sm leading-6 text-blue-800">
                This appointment has been completed.
              </p>
            )}

            {appointment.status
              .toLowerCase() ===
              "cancelled" && (
              <p className="mt-2 text-sm leading-6 text-blue-800">
                This appointment has been cancelled. Review the cancellation information above for details.
              </p>
            )}

            {appointment.status
              .toLowerCase() ===
              "noshow" && (
              <p className="mt-2 text-sm leading-6 text-blue-800">
                This appointment has been marked as a no-show.
              </p>
            )}
          </div>
        )}

      {!isAppointmentRequest(
        request.requestType
      ) && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="font-semibold text-blue-900">
            What happens next?
          </h2>

          {request.status.toLowerCase() ===
            "pending" && (
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Your request has been received and is waiting for a LegacyCare staff member to review it.
            </p>
          )}

          {request.status.toLowerCase() ===
            "approved" && (
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Your request has been approved by LegacyCare.
            </p>
          )}

          {request.status.toLowerCase() ===
            "in progress" && (
            <p className="mt-2 text-sm leading-6 text-blue-800">
              A LegacyCare staff member is currently working on your request.
            </p>
          )}

          {request.status.toLowerCase() ===
            "completed" && (
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Your request has been completed.
            </p>
          )}

          {request.status.toLowerCase() ===
            "rejected" && (
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Your request was not approved. Review the rejection information above or contact LegacyCare for assistance.
            </p>
          )}

          {request.status.toLowerCase() ===
            "cancelled" && (
            <p className="mt-2 text-sm leading-6 text-blue-800">
              This request has been cancelled.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests"
            )
          }
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to My Requests
        </button>

        {canEditAppointment(
          request,
          appointment
        ) && (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/client/service-requests/booking?edit=${request.serviceRequestId}`
              )
            }
            className="rounded-lg border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50"
          >
            ✏️ Edit Appointment
          </button>
        )}

        {canEditFuneral(
          request
        ) && (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/client/service-requests/funeral/edit?id=${request.serviceRequestId}`
              )
            }
            className="rounded-lg border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50"
          >
            ✏️ Edit Funeral
          </button>
        )}
      </div>
    </div>
  );
}