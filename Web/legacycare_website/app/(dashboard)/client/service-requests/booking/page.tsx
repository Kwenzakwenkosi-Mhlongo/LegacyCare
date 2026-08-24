"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
   "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api";
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

type ServiceRequest = {
  serviceRequestId: number;
  clientId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  requestType: string;
  status: string;
  priority: string;
  description?: string | null;
  assignedStaffId?: number | null;
  createdDate?: string;
  updatedDate?: string | null;
  dueDate?: string | null;
  appointmentDateTime?: string | null;
  additionalFee?: number;
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

function getMinimumDateTime() {
  const date = new Date();

  date.setHours(date.getHours() + 24);

  return date;
}

// =========================================================
// REQUEST TYPE HELPERS
// (Appointment + Funeral share the same 24-hour edit rule.
//  Everything else is not editable through this flow.)
// =========================================================

function normalizeType(value: string) {
  return value.trim().toLowerCase();
}

function isAppointmentType(value: string) {
  const type = normalizeType(value);
  return type === "appointment" || type === "appointment request";
}

function isFuneralType(value: string) {
  const type = normalizeType(value);
  return (
    type === "funeral" ||
    type === "funeral service" ||
    type === "funeral request" ||
    type === "funeralservice"
  );
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [appointmentType, setAppointmentType] = useState("");
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState("Normal");

  const [acceptPriorityFee, setAcceptPriorityFee] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [loadingRequest, setLoadingRequest] =
    useState(isEditMode);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [error, setError] = useState("");

  // =========================================================
  // TRACK WHETHER WE ARE EDITING A FUNERAL
  // (Funeral requests don't use the "appointment type" concept,
  //  so that section of the form is skipped for them.)
  // =========================================================

  const [isFuneralEdit, setIsFuneralEdit] = useState(false);

  // =========================================================
  // MINIMUM DATE
  // =========================================================

  const minimumDate = formatDateForInput(
    getMinimumDateTime()
  );

  // =========================================================
  // LOAD REAL BRANCHES
  // =========================================================

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);
        setError("");

        const token = getToken();

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        const response = await fetch(
          `${API_URL}/Branch`,
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
              `Unable to load branches (${response.status}).`
          );
        }

        const mappedBranches: Branch[] =
          Array.isArray(data)
            ? data
                .map((branch) => ({
                  branchId: String(
                    branch.branchId ??
                      branch.id ??
                      ""
                  ),

                  branchName:
                    branch.branchName ??
                    branch.name ??
                    null,
                }))
                .filter(
                  (branch) =>
                    branch.branchId !== ""
                )
            : [];

        setBranches(mappedBranches);
      } catch (err) {
        console.error(
          "Load branches error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load branches."
        );
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  // =========================================================
  // LOAD EXISTING APPOINTMENT / FUNERAL
  // =========================================================

  useEffect(() => {
    if (!editId) {
      setLoadingRequest(false);
      return;
    }

    const loadExistingRequest = async () => {
      try {
        setLoadingRequest(true);
        setError("");

        const token = getToken();

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        const response = await fetch(
          `${API_URL}/ServiceRequest/${editId}`,
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
              `Unable to load request (${response.status}).`
          );
        }

        const request: ServiceRequest = data;

        // =====================================================
        // CHECK REQUEST TYPE
        // Only Appointment and Funeral can be edited here.
        // =====================================================

        const appointment = isAppointmentType(
          request.requestType || ""
        );

        const funeral = isFuneralType(
          request.requestType || ""
        );

        if (!appointment && !funeral) {
          throw new Error(
            "This request cannot be edited online. Please call 0817381235 to make changes."
          );
        }

        setIsFuneralEdit(funeral);

        // =====================================================
        // CHECK STATUS
        // =====================================================

        const status =
          request.status.toLowerCase();

        if (
          [
            "completed",
            "rejected",
            "cancelled",
          ].includes(status)
        ) {
          throw new Error(
            funeral
              ? "This funeral request can no longer be edited."
              : "This appointment can no longer be edited."
          );
        }

        // =====================================================
        // CHECK DATE/TIME
        // =====================================================

        if (!request.appointmentDateTime) {
          throw new Error(
            funeral
              ? "This funeral request does not have a valid date and time."
              : "This appointment does not have a valid appointment date and time."
          );
        }

        const scheduledDate =
          new Date(
            request.appointmentDateTime
          );

        if (
          Number.isNaN(
            scheduledDate.getTime()
          )
        ) {
          throw new Error(
            "The scheduled date and time are invalid."
          );
        }

        // =====================================================
        // CHECK 24-HOUR EDITING RULE
        // Matches backend: 24 hours or less remaining = locked.
        // =====================================================

        const hoursRemaining =
          (scheduledDate.getTime() -
            new Date().getTime()) /
          (1000 * 60 * 60);

        if (hoursRemaining <= 24) {
          throw new Error(
            funeral
              ? "This funeral request can no longer be edited because 24 hours or less remain."
              : "This appointment can no longer be edited because it is less than 24 hours away."
          );
        }

        // =====================================================
        // POPULATE BRANCH
        // =====================================================

        setBranchId(
          request.branchId
            ? String(request.branchId)
            : ""
        );

        // =====================================================
        // POPULATE PRIORITY
        // =====================================================

        const savedPriority =
          request.priority || "Normal";

        setPriority(savedPriority);

        setAcceptPriorityFee(
          savedPriority.toLowerCase() ===
            "high"
        );

        // =====================================================
        // POPULATE DATE / TIME
        // =====================================================

        setDate(
          formatDateForInput(
            scheduledDate
          )
        );

        setTime(
          formatTimeForInput(
            scheduledDate
          )
        );

        // =====================================================
        // APPOINTMENT-ONLY PARSING
        // (Funeral requests don't carry an "Appointment Type"
        //  line, so this only runs for real appointments.)
        // =====================================================

        if (appointment) {
          const appointmentTypeMatch =
            request.description?.match(
              /Appointment Type:\s*(.+)/i
            );

          if (appointmentTypeMatch) {
            setAppointmentType(
              appointmentTypeMatch[1].trim()
            );
          }

          const notesMatch =
            request.description?.match(
              /Additional Notes:\s*([\s\S]+)/i
            );

          if (notesMatch) {
            setDescription(
              notesMatch[1].trim()
            );
          }
        } else {
          // Funeral: use the description as-is.
          setDescription(
            request.description || ""
          );
        }
      } catch (err) {
        console.error(
          "Load existing request error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load request."
        );
      } finally {
        setLoadingRequest(false);
      }
    };

    loadExistingRequest();
  }, [editId]);

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    // =======================================================
    // VALIDATION
    // =======================================================

    // Appointment type only applies to appointments, not funerals.
    if (!isFuneralEdit && !appointmentType) {
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
        isFuneralEdit
          ? "Please select a date."
          : "Please select a preferred date."
      );
      return;
    }

    if (!time) {
      setError(
        isFuneralEdit
          ? "Please select a time."
          : "Please select a preferred time."
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

    // =======================================================
    // CREATE DATE/TIME
    // =======================================================

    const appointmentDateTime = new Date(
      `${date}T${time}:00`
    );

    if (
      Number.isNaN(
        appointmentDateTime.getTime()
      )
    ) {
      setError(
        "Invalid date or time."
      );
      return;
    }

    // =======================================================
    // MUST BE FUTURE
    // =======================================================

    if (
      appointmentDateTime.getTime() <=
      new Date().getTime()
    ) {
      setError(
        isFuneralEdit
          ? "The date and time must be in the future."
          : "The appointment date and time must be in the future."
      );
      return;
    }

    // =======================================================
    // 24-HOUR RULE (matches backend: <= 24 is locked)
    // =======================================================

    const hoursRemaining =
      (appointmentDateTime.getTime() -
        new Date().getTime()) /
      (1000 * 60 * 60);

    if (hoursRemaining <= 24) {
      setError(
        isFuneralEdit
          ? "Funeral requests must be scheduled more than 24 hours in advance."
          : "Appointments must be booked more than 24 hours in advance."
      );
      return;
    }

    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      // =====================================================
      // EDIT EXISTING APPOINTMENT / FUNERAL
      //
      // IMPORTANT FIX:
      // The backend's UpdateServiceRequestRequest DTO only has
      // BranchId, Description, and AppointmentDateTime. This
      // used to send "date" and "time" as separate raw fields,
      // which don't bind to anything on the backend, so
      // AppointmentDateTime always arrived as null and the
      // update was rejected with "date and time are required."
      // =====================================================

      if (isEditMode && editId) {
        const finalDescription = isFuneralEdit
          ? description
          : [
              `Appointment Type: ${appointmentType}`,
              `Requested Date: ${date}`,
              `Requested Time: ${time}`,
              description
                ? `Additional Notes: ${description}`
                : "",
            ]
              .filter(Boolean)
              .join("\n");

        const response = await fetch(
          `${API_URL}/ServiceRequest/${editId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              branchId: branchId || null,
              description: finalDescription,
              appointmentDateTime:
                appointmentDateTime.toISOString(),
            }),
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to update request (${response.status}).`
          );
        }

        router.push(
          `/client/service-requests/${editId}`
        );

        return;
      }

      // =====================================================
      // CREATE NEW APPOINTMENT
      // (Funeral creation is not part of this flow.)
      // =====================================================

      const additionalFee =
        priority === "High"
          ? 100
          : 0;

      const response = await fetch(
        `${API_URL}/ServiceRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requestType: "Appointment",

            priority,

            acceptPriorityFee,

            additionalFee,

            branchId: branchId || null,

            appointmentDateTime:
              appointmentDateTime.toISOString(),

            description: [
              `Appointment Type: ${appointmentType}`,
              `Requested Date: ${date}`,
              `Requested Time: ${time}`,
              description
                ? `Additional Notes: ${description}`
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to submit booking request (${response.status}).`
        );
      }

      router.push(
        "/client/service-requests"
      );
    } catch (err) {
      console.error(
        "Booking request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to process request."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOADING EXISTING REQUEST
  // =========================================================

  if (loadingRequest) {
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

  // =========================================================
  // PAGE
  // =========================================================

  const pageTitle = isEditMode
    ? isFuneralEdit
      ? "Edit Funeral Request"
      : "Edit Appointment"
    : "Book an Appointment";

  const pageSubtitle = isEditMode
    ? isFuneralEdit
      ? "Update this funeral request before the 24-hour editing deadline."
      : "Update your appointment before the 24-hour editing deadline."
    : "Request an appointment with a LegacyCare branch or staff member.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              isEditMode && editId
                ? `/client/service-requests/${editId}`
                : "/client/service-requests"
            )
          }
          className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          {pageTitle}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {pageSubtitle}
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>

            <div>
              <p className="font-semibold text-red-800">
                Unable to continue
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>

              {isEditMode && editId && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/client/service-requests/${editId}`
                    )
                  }
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Back to Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >

        {/* APPOINTMENT TYPE — hidden when editing a funeral */}

        {!isFuneralEdit && (
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
                        value={type.value}
                        checked={
                          appointmentType ===
                          type.value
                        }
                        onChange={(event) =>
                          setAppointmentType(
                            event.target.value
                          )
                        }
                        className="mt-1"
                      />

                      <div>
                        <p className="font-medium text-gray-900">
                          {type.label}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>
        )}

        {/* BRANCH */}

        <div className="mt-6">
          <label
            htmlFor="branch"
            className="block text-sm font-medium text-gray-700"
          >
            {isFuneralEdit ? "Branch" : "Preferred Branch"}
          </label>

          <select
            id="branch"
            value={branchId}
            onChange={(event) =>
              setBranchId(
                event.target.value
              )
            }
            disabled={loadingBranches}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {loadingBranches
                ? "Loading branches..."
                : "Select a branch"}
            </option>

            {branches.map((branch) => {
              const branchName =
                branch.branchName ||
                branch.name ||
                "Unknown Branch";

              return (
                <option
                  key={branch.branchId}
                  value={branch.branchId}
                >
                  {branchName} ({branch.branchId})
                </option>
              );
            })}
          </select>

          {!loadingBranches &&
            branches.length === 0 && (
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
                {branches.find(
                  (branch) =>
                    branch.branchId ===
                    branchId
                )?.branchName ||
                  branches.find(
                    (branch) =>
                      branch.branchId ===
                      branchId
                  )?.name ||
                  "Branch"}{" "}
                ({branchId})
              </p>
            </div>
          )}
        </div>

        {/* DATE */}

        <div className="mt-6">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            {isFuneralEdit ? "Date" : "Preferred Date"}
          </label>

          <input
            id="date"
            type="date"
            value={date}
            min={minimumDate}
            onChange={(event) =>
              setDate(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            {isFuneralEdit
              ? "Must be scheduled more than 24 hours in advance."
              : "Appointments must be booked more than 24 hours in advance."}
          </p>
        </div>

        {/* TIME */}

        <div className="mt-6">
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700"
          >
            {isFuneralEdit ? "Time" : "Preferred Time"}
          </label>

          <select
            id="time"
            value={time}
            onChange={(event) =>
              setTime(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">
              Select a time
            </option>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
          </select>
        </div>

        {/* PRIORITY */}

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Request Priority
          </label>

          <div className="mt-3 space-y-3">

            <label
              className={`block cursor-pointer rounded-xl border p-4 transition ${
                priority === "Normal"
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="priority"
                  value="Normal"
                  checked={priority === "Normal"}
                  onChange={() => {
                    setPriority("Normal");
                    setAcceptPriorityFee(false);
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
                priority === "High"
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="priority"
                  value="High"
                  checked={priority === "High"}
                  onChange={() => {
                    setPriority("High");
                    setAcceptPriorityFee(false);
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

          {priority === "High" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="text-xl">⚠️</div>

                <div>
                  <p className="font-semibold text-amber-900">
                    High Priority Service Fee
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Choosing High Priority will add an additional
                    <strong> R100.00 service fee</strong> to this request.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceptPriorityFee}
                      onChange={(event) =>
                        setAcceptPriorityFee(
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <span className="text-sm text-amber-900">
                      I understand and agree to the additional
                      R100.00 High Priority service fee.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOTES */}

        <div className="mt-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            {isFuneralEdit ? "Details" : "Additional Notes"}
          </label>

          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Tell us anything else we should know..."
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* BUTTONS */}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() =>
              router.push(
                isEditMode && editId
                  ? `/client/service-requests/${editId}`
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
              loading ||
              loadingBranches ||
              (priority === "High" &&
                !acceptPriorityFee)
            }
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? isEditMode
                ? "Updating..."
                : "Submitting..."
              : isEditMode
                ? "Save Changes"
                : "Submit Booking Request"}
          </button>
        </div>
      </form>

      {/* INFORMATION */}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-900">
          {isFuneralEdit ? "Funeral Request Policy" : "Appointment Policy"}
        </h2>

        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>
            • {isFuneralEdit ? "Funeral requests" : "Appointments"} must be
            scheduled more than 24 hours in advance.
          </li>

          <li>
            • You may edit while there are more than 24 hours remaining.
          </li>

          <li>
            • Once 24 hours or less remain, editing is no longer available.
          </li>

          <li>
            • Changing this request sends it back to LegacyCare for
            confirmation.
          </li>

          <li>
            • High Priority requests have an additional R100.00 service fee.
          </li>
        </ul>
      </div>
    </div>
  );
}