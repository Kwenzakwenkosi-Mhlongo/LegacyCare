// File: app/(dashboard)/client/service-requests/booking/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

const appointmentTypes = [
  {
    value: "Policy Consultation",
    label: "Policy Consultation",
    description:
      "Discuss your policy, coverage, benefits or policy questions.",
  },
  {
    value: "Funeral Planning",
    label: "Funeral Planning",
    description:
      "Discuss funeral arrangements and available LegacyCare services.",
  },
  {
    value: "General Enquiry",
    label: "General Enquiry",
    description:
      "Speak to a LegacyCare staff member about another matter.",
  },
];

type Branch = {
  branchId: string;
  branchName?: string | null;
  name?: string | null;
};

type Appointment = {
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
};

type ApiError = {
  message?: string;
  title?: string;
};

function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getMinimumDate() {
  const date = new Date();
  date.setHours(date.getHours() + 24);

  return formatDateForInput(date);
}

async function readApiResponse<T>(
  response: Response
): Promise<T | null> {
  return response
    .json()
    .then((data) => data as T)
    .catch(() => null);
}

function getApiErrorMessage(
  data: ApiError | null,
  fallback: string
) {
  return data?.message || data?.title || fallback;
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editServiceRequestId = searchParams.get("edit");
  const isEditMode = Boolean(editServiceRequestId);

  const [appointmentId, setAppointmentId] =
    useState<number | null>(null);

  const [appointmentType, setAppointmentType] =
    useState("");

  const [branchId, setBranchId] =
    useState("");

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [clientNotes, setClientNotes] =
    useState("");

  const [priority, setPriority] =
    useState("Normal");

  const [acceptPriorityFee, setAcceptPriorityFee] =
    useState(false);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [loadingAppointment, setLoadingAppointment] =
    useState(isEditMode);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const minimumDate =
    useMemo(
      () => getMinimumDate(),
      []
    );

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);

        const token =
          getToken();

        if (!token) {
          setError(
            "You are not logged in."
          );

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
              cache: "no-store",
            }
          );

        const data =
          await readApiResponse<unknown>(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError | null,
              `Unable to load branches (${response.status}).`
            )
          );
        }

        const mappedBranches: Branch[] =
          Array.isArray(data)
            ? data
                .map((branch) => {
                  const value =
                    branch as Record<
                      string,
                      unknown
                    >;

                  return {
                    branchId:
                      String(
                        value.branchId ??
                          value.id ??
                          ""
                      ),

                    branchName:
                      typeof value.branchName ===
                      "string"
                        ? value.branchName
                        : null,

                    name:
                      typeof value.name ===
                      "string"
                        ? value.name
                        : null,
                  };
                })
                .filter(
                  (branch) =>
                    branch.branchId !== ""
                )
            : [];

        setBranches(
          mappedBranches
        );
      } catch (err) {
        console.error(
          "[BookingPage] Load branches error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load branches."
        );
      } finally {
        setLoadingBranches(
          false
        );
      }
    };

    void loadBranches();
  }, []);

  useEffect(() => {
    if (!editServiceRequestId) {
      setLoadingAppointment(
        false
      );

      return;
    }

    const serviceRequestId =
      Number(
        editServiceRequestId
      );

    if (
      !Number.isInteger(
        serviceRequestId
      ) ||
      serviceRequestId <= 0
    ) {
      setError(
        "Invalid service request ID."
      );

      setLoadingAppointment(
        false
      );

      return;
    }

    const loadAppointment =
      async () => {
        try {
          setLoadingAppointment(
            true
          );

          setError("");

          const token =
            getToken();

          if (!token) {
            setError(
              "You are not logged in."
            );

            return;
          }

          const response =
            await fetch(
              `${API_URL}/Appointment/my/by-service-request/${serviceRequestId}`,
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
            await readApiResponse<
              Appointment | ApiError
            >(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiErrorMessage(
                data as ApiError | null,
                `Unable to load appointment (${response.status}).`
              )
            );
          }

          const appointment =
            data as Appointment;

          if (
            !appointment ||
            !appointment.appointmentId
          ) {
            throw new Error(
              "Appointment details were incomplete."
            );
          }

          const status =
            (
              appointment.status ||
              ""
            )
              .trim()
              .toLowerCase();

          if (
            [
              "completed",
              "cancelled",
              "noshow",
            ].includes(
              status
            )
          ) {
            throw new Error(
              "This appointment can no longer be edited."
            );
          }

          const scheduledDate =
            new Date(
              appointment.confirmedDateTime ??
                appointment.preferredDateTime
            );

          if (
            Number.isNaN(
              scheduledDate.getTime()
            )
          ) {
            throw new Error(
              "The appointment date and time are invalid."
            );
          }

          const hoursRemaining =
            (
              scheduledDate.getTime() -
              Date.now()
            ) /
            (
              1000 *
              60 *
              60
            );

          if (
            hoursRemaining <= 24
          ) {
            throw new Error(
              "This appointment can no longer be edited because 24 hours or less remain."
            );
          }

          const preferredDate =
            new Date(
              appointment.preferredDateTime
            );

          if (
            Number.isNaN(
              preferredDate.getTime()
            )
          ) {
            throw new Error(
              "The preferred appointment date and time are invalid."
            );
          }

          setAppointmentId(
            appointment.appointmentId
          );

          setAppointmentType(
            appointment.appointmentType ||
              ""
          );

          setBranchId(
            appointment.branchId ||
              ""
          );

          setDate(
            formatDateForInput(
              preferredDate
            )
          );

          setTime(
            formatTimeForInput(
              preferredDate
            )
          );

          setClientNotes(
            appointment.clientNotes ||
              ""
          );

          const savedPriority =
            appointment.priority ||
            "Normal";

          setPriority(
            savedPriority
          );

          setAcceptPriorityFee(
            savedPriority.toLowerCase() ===
              "high"
          );
        } catch (err) {
          console.error(
            "[BookingPage] Load appointment error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load appointment."
          );
        } finally {
          setLoadingAppointment(
            false
          );
        }
      };

    void loadAppointment();
  }, [editServiceRequestId]);

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError("");

      if (!appointmentType) {
        setError(
          "Please select an appointment type."
        );

        return;
      }

      if (!branchId) {
        setError(
          "Please select a preferred branch."
        );

        return;
      }

      if (!date) {
        setError(
          "Please select a preferred date."
        );

        return;
      }

      if (!time) {
        setError(
          "Please select a preferred time."
        );

        return;
      }

      if (
        priority === "High" &&
        !acceptPriorityFee
      ) {
        setError(
          "Please accept the R100.00 High Priority service fee."
        );

        return;
      }

      const preferredDateTime =
        new Date(
          `${date}T${time}:00`
        );

      if (
        Number.isNaN(
          preferredDateTime.getTime()
        )
      ) {
        setError(
          "Invalid date or time."
        );

        return;
      }

      if (
        preferredDateTime.getTime() <=
        Date.now()
      ) {
        setError(
          "The appointment date and time must be in the future."
        );

        return;
      }

      const hoursRemaining =
        (
          preferredDateTime.getTime() -
          Date.now()
        ) /
        (
          1000 *
          60 *
          60
        );

      if (
        hoursRemaining <= 24
      ) {
        setError(
          "Appointments must be booked more than 24 hours in advance."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        const token =
          getToken();

        if (!token) {
          setError(
            "You are not logged in."
          );

          return;
        }

        const payload = {
          appointmentType,

          branchId,

          preferredDateTime:
            preferredDateTime.toISOString(),

          clientNotes:
            clientNotes.trim() ||
            null,

          priority,

          acceptPriorityFee,
        };

        if (isEditMode) {
          if (
            !appointmentId
          ) {
            throw new Error(
              "Appointment ID is missing."
            );
          }

          const response =
            await fetch(
              `${API_URL}/Appointment/my/${appointmentId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                  Accept:
                    "application/json",
                  Authorization:
                    `Bearer ${token}`,
                },
                body:
                  JSON.stringify(
                    payload
                  ),
              }
            );

          const data =
            await readApiResponse<
              Appointment | ApiError
            >(
              response
            );

          if (!response.ok) {
            throw new Error(
              getApiErrorMessage(
                data as ApiError | null,
                `Unable to update appointment (${response.status}).`
              )
            );
          }

          router.push(
            `/client/service-requests/${editServiceRequestId}`
          );

          router.refresh();

          return;
        }

        const response =
          await fetch(
            `${API_URL}/Appointment`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await readApiResponse<
            Appointment | ApiError
          >(
            response
          );

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError | null,
              `Unable to submit appointment (${response.status}).`
            )
          );
        }

        router.push(
          "/client/service-requests"
        );

        router.refresh();
      } catch (err) {
        console.error(
          "[BookingPage] Submit error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to process appointment."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  if (loadingAppointment) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch =
    branches.find(
      (branch) =>
        branch.branchId ===
        branchId
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              isEditMode &&
                editServiceRequestId
                ? `/client/service-requests/${editServiceRequestId}`
                : "/client/service-requests"
            )
          }
          className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode
            ? "Edit Appointment"
            : "Book an Appointment"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {isEditMode
            ? "Update your appointment while more than 24 hours remain."
            : "Request an appointment with a LegacyCare branch."}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              ⚠️
            </span>

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

      <form
        onSubmit={
          handleSubmit
        }
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            What would you like to discuss?
          </label>

          <div className="mt-3 space-y-3">
            {appointmentTypes.map(
              (type) => (
                <label
                  key={type.value}
                  className={`block cursor-pointer rounded-xl border p-4 transition ${
                    appointmentType ===
                    type.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="appointmentType"
                      value={
                        type.value
                      }
                      checked={
                        appointmentType ===
                        type.value
                      }
                      onChange={(
                        event
                      ) =>
                        setAppointmentType(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-medium text-gray-900">
                        {
                          type.label
                        }
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {
                          type.description
                        }
                      </p>
                    </div>
                  </div>
                </label>
              )
            )}
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="branch"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Branch
          </label>

          <select
            id="branch"
            value={
              branchId
            }
            onChange={(
              event
            ) =>
              setBranchId(
                event.target
                  .value
              )
            }
            disabled={
              loadingBranches
            }
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {loadingBranches
                ? "Loading branches..."
                : "Select a branch"}
            </option>

            {branches.map(
              (branch) => {
                const branchName =
                  branch.branchName ||
                  branch.name ||
                  "Unknown Branch";

                return (
                  <option
                    key={
                      branch.branchId
                    }
                    value={
                      branch.branchId
                    }
                  >
                    {
                      branchName
                    }{" "}
                    (
                    {
                      branch.branchId
                    }
                    )
                  </option>
                );
              }
            )}
          </select>

          {!loadingBranches &&
            branches.length ===
              0 && (
              <p className="mt-2 text-xs text-red-600">
                No branches are currently available.
              </p>
            )}

          {branchId && (
            <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                Selected Branch
              </p>

              <p className="mt-1 text-sm font-semibold text-teal-900">
                {selectedBranch
                  ?.branchName ||
                  selectedBranch
                    ?.name ||
                  "Branch"}{" "}
                ({branchId})
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Date
          </label>

          <input
            id="date"
            type="date"
            value={
              date
            }
            min={
              minimumDate
            }
            onChange={(
              event
            ) =>
              setDate(
                event.target
                  .value
              )
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            Appointments must be booked more than 24 hours in advance.
          </p>
        </div>

        <div className="mt-6">
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Time
          </label>

          <select
            id="time"
            value={
              time
            }
            onChange={(
              event
            ) =>
              setTime(
                event.target
                  .value
              )
            }
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">
              Select a time
            </option>

            <option value="09:00">
              09:00
            </option>

            <option value="10:00">
              10:00
            </option>

            <option value="11:00">
              11:00
            </option>

            <option value="12:00">
              12:00
            </option>

            <option value="13:00">
              13:00
            </option>

            <option value="14:00">
              14:00
            </option>

            <option value="15:00">
              15:00
            </option>

            <option value="16:00">
              16:00
            </option>
          </select>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Request Priority
          </label>

          <div className="mt-3 space-y-3">
            <label
              className={`block cursor-pointer rounded-xl border p-4 transition ${
                priority ===
                "Normal"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="priority"
                  value="Normal"
                  checked={
                    priority ===
                    "Normal"
                  }
                  onChange={() => {
                    setPriority(
                      "Normal"
                    );

                    setAcceptPriorityFee(
                      false
                    );
                  }}
                  className="mt-1"
                />

                <div>
                  <p className="font-medium text-gray-900">
                    Normal Priority
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Standard processing. No additional service fee.
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    Additional fee: R0.00
                  </p>
                </div>
              </div>
            </label>

            <label
              className={`block cursor-pointer rounded-xl border p-4 transition ${
                priority ===
                "High"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="priority"
                  value="High"
                  checked={
                    priority ===
                    "High"
                  }
                  onChange={() => {
                    setPriority(
                      "High"
                    );

                    setAcceptPriorityFee(
                      false
                    );
                  }}
                  className="mt-1"
                />

                <div>
                  <p className="font-medium text-gray-900">
                    High Priority
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Your request receives priority handling.
                  </p>

                  <p className="mt-2 text-sm font-semibold text-amber-700">
                    Additional service fee: R100.00
                  </p>
                </div>
              </div>
            </label>
          </div>

          {priority ===
            "High" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="text-xl">
                  ⚠️
                </div>

                <div>
                  <p className="font-semibold text-amber-900">
                    High Priority Service Fee
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Choosing High Priority adds an additional{" "}
                    <strong>
                      R100.00 service fee
                    </strong>
                    .
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        acceptPriorityFee
                      }
                      onChange={(
                        event
                      ) =>
                        setAcceptPriorityFee(
                          event
                            .target
                            .checked
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <span className="text-sm text-amber-900">
                      I understand and agree to the additional R100.00 High Priority service fee.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <label
            htmlFor="clientNotes"
            className="block text-sm font-medium text-gray-700"
          >
            Additional Notes
          </label>

          <textarea
            id="clientNotes"
            rows={
              4
            }
            value={
              clientNotes
            }
            onChange={(
              event
            ) =>
              setClientNotes(
                event.target
                  .value
              )
            }
            placeholder="Tell us anything else we should know..."
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.push(
                isEditMode &&
                  editServiceRequestId
                  ? `/client/service-requests/${editServiceRequestId}`
                  : "/client/service-requests"
              )
            }
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              loadingBranches ||
              Boolean(
                error &&
                  isEditMode &&
                  !appointmentId
              ) ||
              (
                priority ===
                  "High" &&
                !acceptPriorityFee
              )
            }
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? isEditMode
                ? "Updating..."
                : "Submitting..."
              : isEditMode
                ? "Save Changes"
                : "Submit Appointment Request"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-900">
          Appointment Policy
        </h2>

        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>
            • Appointments must be booked more than 24 hours in advance.
          </li>

          <li>
            • You may edit while more than 24 hours remain.
          </li>

          <li>
            • Changing the preferred date or branch sends the appointment back for Clerk confirmation.
          </li>

          <li>
            • The Clerk may confirm your requested time or reschedule it.
          </li>

          <li>
            • High Priority requests have an additional R100.00 service fee.
          </li>
        </ul>
      </div>
    </div>
  );
}