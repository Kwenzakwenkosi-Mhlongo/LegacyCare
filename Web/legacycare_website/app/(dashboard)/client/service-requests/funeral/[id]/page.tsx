// ============================================================================
// FILE 2
// Web/legacycare_website/app/(dashboard)/client/service-requests/funeral/[id]/page.tsx
// ============================================================================

"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type DeathNotification = {
  deathNotificationId: string;
  requestNumber?: string | null;
  beneficiaryId?: string | null;
  beneficiaryName?: string | null;
  dateOfDeath?: string | null;
  status?: string | number | null;

  beneficiary?: {
    beneficiaryId?: string | null;
    fullName?: string | null;
  } | null;
};

type FuneralRequest = {
  funeralRequestId: string;
  deathNotificationId: string;
  status?: string | null;
};

const FUNERAL_TYPES = [
  {
    value: "Standard",
    label: "Standard Funeral",
    description:
      "A standard funeral arrangement with LegacyCare coordination.",
  },
  {
    value: "Large",
    label: "Large Funeral",
    description:
      "For larger gatherings that may require additional coordination.",
  },
];

function normalizeStatus(
  value?: string | number | null
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isApproved(
  value?: string | number | null
): boolean {
  const status =
    normalizeStatus(value);

  return (
    status === "approved" ||
    status === "1"
  );
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
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

function getBeneficiaryName(
  notification: DeathNotification
): string {
  return (
    notification.beneficiaryName ||
    notification.beneficiary
      ?.fullName ||
    notification.beneficiaryId ||
    "Beneficiary"
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
    const message =
      (
        data as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }

  if (
    typeof data === "string"
  ) {
    return data;
  }

  return fallback;
}

export default function FuneralArrangementPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const deathNotificationId =
    String(
      params.id ?? ""
    );

  const [
    notification,
    setNotification,
  ] =
    useState<
      DeathNotification | null
    >(null);

  const [
    existingFuneral,
    setExistingFuneral,
  ] =
    useState<
      FuneralRequest | null
    >(null);

  const [
    funeralDate,
    setFuneralDate,
  ] =
    useState("");

  const [
    funeralTime,
    setFuneralTime,
  ] =
    useState("");

  const [
    venue,
    setVenue,
  ] =
    useState("");

  const [
    funeralType,
    setFuneralType,
  ] =
    useState("Standard");

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const minimumDate =
    useMemo(
      () => {
        const date =
          new Date();

        return date
          .toISOString()
          .split("T")[0];
      },
      []
    );

  useEffect(() => {
    document.title =
      "Funeral Arrangement | LegacyCare";

    if (
      !deathNotificationId
    ) {
      setError(
        "Death notification ID is missing."
      );

      setLoading(false);

      return;
    }

    const loadPage =
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");

          const token =
            getToken();

          if (!token) {
            router.replace(
              "/login"
            );

            return;
          }

          const headers = {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          };

          const [
            deathResponse,
            funeralsResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/DeathNotification/client`,
                {
                  method:
                    "GET",

                  headers,

                  cache:
                    "no-store",
                }
              ),

              fetch(
                `${API_URL}/FuneralRequest/client`,
                {
                  method:
                    "GET",

                  headers,

                  cache:
                    "no-store",
                }
              ),
            ]);

          const deathData =
            await deathResponse
              .json()
              .catch(
                () => null
              );

          if (
            !deathResponse.ok
          ) {
            throw new Error(
              extractErrorMessage(
                deathData,
                `Unable to load death notification (${deathResponse.status}).`
              )
            );
          }

          const notifications:
            DeathNotification[] =
            Array.isArray(
              deathData
            )
              ? deathData
              : [];

          const currentNotification =
            notifications.find(
              (item) =>
                String(
                  item.deathNotificationId
                ).toLowerCase() ===
                deathNotificationId.toLowerCase()
            );

          if (
            !currentNotification
          ) {
            throw new Error(
              "Death notification was not found or does not belong to your account."
            );
          }

          setNotification(
            currentNotification
          );

          const funeralsData =
            await funeralsResponse
              .json()
              .catch(
                () => null
              );

          if (
            !funeralsResponse.ok
          ) {
            throw new Error(
              extractErrorMessage(
                funeralsData,
                `Unable to check existing funeral requests (${funeralsResponse.status}).`
              )
            );
          }

          const funerals:
            FuneralRequest[] =
            Array.isArray(
              funeralsData
            )
              ? funeralsData
              : [];

          const duplicate =
            funerals.find(
              (funeral) =>
                String(
                  funeral.deathNotificationId
                ).toLowerCase() ===
                deathNotificationId.toLowerCase()
            );

          setExistingFuneral(
            duplicate || null
          );

          if (
            !isApproved(
              currentNotification.status
            )
          ) {
            setError(
              "This death notification has not been approved. Funeral arrangements can only be submitted after approval."
            );
          }
        } catch (err) {
          console.error(
            "[Funeral Create] LOAD ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load funeral arrangement."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPage();
  }, [
    deathNotificationId,
    router,
  ]);

  async function handleSubmit(
    event: FormEvent
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !notification
    ) {
      setError(
        "Death notification could not be loaded."
      );

      return;
    }

    if (
      !isApproved(
        notification.status
      )
    ) {
      setError(
        "This death notification must be approved before a funeral can be arranged."
      );

      return;
    }

    if (
      existingFuneral
    ) {
      setError(
        "A funeral request already exists for this death notification."
      );

      return;
    }

    if (
      !funeralDate
    ) {
      setError(
        "Please select a funeral date."
      );

      return;
    }

    if (
      !funeralTime
    ) {
      setError(
        "Please select a funeral time."
      );

      return;
    }

    if (
      !venue.trim()
    ) {
      setError(
        "Please provide the funeral venue."
      );

      return;
    }

    const funeralDateTime =
      new Date(
        `${funeralDate}T${funeralTime}:00`
      );

    if (
      Number.isNaN(
        funeralDateTime.getTime()
      )
    ) {
      setError(
        "Please provide a valid funeral date and time."
      );

      return;
    }

    if (
      funeralDateTime.getTime() <=
      Date.now()
    ) {
      setError(
        "The funeral date and time must be in the future."
      );

      return;
    }

    try {
      setSubmitting(true);

      const token =
        getToken();

      if (!token) {
        router.replace(
          "/login"
        );

        return;
      }

      const response =
        await fetch(
          `${API_URL}/FuneralRequest`,
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
                deathNotificationId,

                funeralDate:
                  `${funeralDate}T00:00:00`,

                funeralTime:
                  `${funeralTime}:00`,

                venue:
                  venue.trim(),

                funeralType,

                notes:
                  notes.trim() ||
                  null,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          extractErrorMessage(
            data,
            `Unable to submit funeral request (${response.status}).`
          )
        );
      }

      setExistingFuneral({
        funeralRequestId:
          data?.funeralRequestId ||
          "",

        deathNotificationId,

        status:
          data?.status ||
          "Pending",
      });

      setSuccess(
        "Your funeral arrangement has been submitted successfully. LegacyCare will now review the request and arrange the required operational staff."
      );
    } catch (err) {
      console.error(
        "[Funeral Create] SUBMIT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit funeral request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests/funeral"
            )
          }
          className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Funeral Arrangements
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          Funeral Arrangement
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Provide the funeral details for LegacyCare review.
        </p>
      </div>

      {notification ? (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              🕊️
            </div>

            <div>
              <h2 className="font-semibold text-green-900">
                Approved Death Notification
              </h2>

              <p className="mt-1 text-sm text-green-800">
                {getBeneficiaryName(
                  notification
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-green-700">
                Notification
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {notification.requestNumber ||
                  notification.deathNotificationId}
              </p>
            </div>

            <div>
              <p className="text-xs text-green-700">
                Date of Death
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(
                  notification.dateOfDeath
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-green-700">
                Status
              </p>

              <p className="mt-1 text-sm font-semibold text-green-700">
                {isApproved(
                  notification.status
                )
                  ? "Approved"
                  : String(
                      notification.status
                    )}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {existingFuneral ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="font-semibold text-blue-900">
            ✅ Funeral request already submitted
          </h2>

          <p className="mt-2 text-sm text-blue-700">
            A funeral arrangement already exists for this death notification.
            Another request cannot be created.
          </p>

          <p className="mt-3 text-sm font-medium text-blue-900">
            Status:{" "}
            {existingFuneral.status ||
              "Pending"}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/client/service-requests/funeral"
              )
            }
            className="mt-4 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            View Funeral Requests
          </button>
        </section>
      ) : null}

      {success ? (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 className="font-semibold text-green-900">
            ✅ Funeral request submitted
          </h2>

          <p className="mt-2 text-sm leading-6 text-green-800">
            {success}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/client/service-requests/funeral"
              )
            }
            className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            View Funeral Requests
          </button>
        </section>
      ) : null}

      {notification &&
      isApproved(
        notification.status
      ) &&
      !existingFuneral &&
      !success ? (
        <>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="font-semibold text-blue-900">
              ⚰️ What happens next?
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-800">
              After submission the request remains Pending. A Clerk reviews the
              arrangement, assigns the required operational staff and can then
              approve or reject the funeral request.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Funeral Type
              </label>

              <div className="mt-3 space-y-3">
                {FUNERAL_TYPES.map(
                  (type) => (
                    <label
                      key={
                        type.value
                      }
                      className={`block cursor-pointer rounded-xl border p-4 ${
                        funeralType ===
                        type.value
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="funeralType"
                          value={
                            type.value
                          }
                          checked={
                            funeralType ===
                            type.value
                          }
                          onChange={(
                            event
                          ) =>
                            setFuneralType(
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

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="funeralDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Funeral Date
                </label>

                <input
                  id="funeralDate"
                  type="date"
                  required
                  min={
                    minimumDate
                  }
                  value={
                    funeralDate
                  }
                  onChange={(
                    event
                  ) =>
                    setFuneralDate(
                      event
                        .target
                        .value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>

              <div>
                <label
                  htmlFor="funeralTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  Funeral Time
                </label>

                <input
                  id="funeralTime"
                  type="time"
                  required
                  value={
                    funeralTime
                  }
                  onChange={(
                    event
                  ) =>
                    setFuneralTime(
                      event
                        .target
                        .value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="venue"
                className="block text-sm font-medium text-gray-700"
              >
                Funeral Venue
              </label>

              <input
                id="venue"
                type="text"
                required
                maxLength={
                  250
                }
                value={
                  venue
                }
                onChange={(
                  event
                ) =>
                  setVenue(
                    event
                      .target
                      .value
                  )
                }
                placeholder="e.g. St Mary's Church, 12 Main Road, Johannesburg"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Additional Notes
                <span className="ml-1 font-normal text-gray-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="notes"
                rows={5}
                maxLength={
                  1500
                }
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Any accessibility needs, special arrangements, venue instructions or other information LegacyCare should know..."
                className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-4 py-3"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {
                  notes.length
                }
                /1500
              </p>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() =>
                  router.push(
                    "/client/service-requests/funeral"
                  )
                }
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Funeral Request"}
              </button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}

