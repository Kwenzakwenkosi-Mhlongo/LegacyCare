// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/page.tsx

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
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

const LEGACYCARE_CONTACT_NUMBER =
  "0817381235";

enum AppointmentStatus {
  Requested = 0,
  Confirmed = 1,
  Rescheduled = 2,
  Completed = 3,
  Cancelled = 4,
  NoShow = 5,
}

enum DeathNotificationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

enum FuneralRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

enum QuoteRequestStatus {
  Requested = 0,
  InReview = 1,
  Quoted = 2,
  Completed = 3,
  Rejected = 4,
  Cancelled = 5,
}

enum PolicyEnquiryStatus {
  Submitted = 0,
  InReview = 1,
  Responded = 2,
  Resolved = 3,
  Closed = 4,
}

enum PaymentEnquiryStatus {
  Submitted = 0,
  InReview = 1,
  AwaitingClient = 2,
  Resolved = 3,
  Closed = 4,
}

enum DocumentRequestStatus {
  Submitted = 0,
  Processing = 1,
  Ready = 2,
  Delivered = 3,
  Rejected = 4,
  Cancelled = 5,
}

enum GeneralSupportStatus {
  Submitted = 0,
  InProgress = 1,
  AwaitingClient = 2,
  Resolved = 3,
  Closed = 4,
}

enum RequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

enum BeneficiaryRequestType {
  Add = 0,
  Remove = 1,
  Update = 2,
}

enum BeneficiaryRelationship {
  Spouse = 0,
  Child = 1,
  Parent = 2,
  Sibling = 3,
  GrandParent = 4,
  Other = 5,
}

type ServiceKey =
  | "death"
  | "funeral"
  | "appointment"
  | "quote"
  | "policy"
  | "payment"
  | "documents"
  | "support"
  | "packageChange"
  | "beneficiaryChange";

type StartRequestKey = Exclude<
  ServiceKey,
  "packageChange" | "beneficiaryChange"
>;

type StartRequestDefinition = {
  key: StartRequestKey;
  title: string;
  description: string;
  icon: string;
  href: string;
};

type TrackingDefinition = {
  key: ServiceKey;
  title: string;
  icon: string;
  href: string;
  actionLabel: string;
};

type Branch = {
  branchId: string;
  branchName: string;
};

type PolicySummary = {
  policyId: string;
};

type ServiceRequest = {
  serviceRequestId: number;
  branchId?: string | null;
  branchName?: string | null;
  requestType: string;
  status: string | number;
  priority: string;
  description?: string | null;
  createdDate: string;
  updatedDate?: string | null;
};

type AppointmentSummary = {
  appointmentId: number;
  serviceRequestId: number;
  branchId: string;
  appointmentType: string;
  preferredDateTime: string;
  confirmedDateTime?: string | null;
  status: string | number;
  priority: string;
  clientNotes?: string | null;
};

type PackageDetails = {
  packageId: string;
  name: string;
};

type PackageChangeRequest = {
  requestId: string;
  policyId: string;
  newPackageId: string;
  requestDate: string;
  status:
    | RequestStatus
    | string
    | number;
  newPackage?:
    | PackageDetails
    | null;
};

type BeneficiarySummary = {
  beneficiaryId: string;
  fullName: string;
};

type BeneficiaryChangeRequest = {
  requestId: string;
  policyId: string;
  requestType:
    | BeneficiaryRequestType
    | string
    | number;
  status:
    | RequestStatus
    | string
    | number;
  requestDate: string;
  description?: string | null;
  beneficiaryId?: string | null;
  fullName?: string | null;
  relationship:
    | BeneficiaryRelationship
    | string
    | number;
  beneficiary?:
    | BeneficiarySummary
    | null;
};

type StatusSummaryItem = {
  label: string;
  count: number;
};

const startRequestTypes:
  StartRequestDefinition[] = [
  {
    key: "death",
    title: "Report a Death",
    description:
      "Report a death and submit the required information and supporting documents.",
    icon: "🕊️",
    href: "/client/service-requests/death",
  },
  {
    key: "funeral",
    title: "Funeral",
    description:
      "Begin funeral arrangements for an approved death notification.",
    icon: "⚰️",
    href: "/client/service-requests/funeral",
  },
  {
    key: "appointment",
    title: "Appointment",
    description:
      "Book an appointment with a LegacyCare branch or staff member.",
    icon: "📅",
    href: "/client/service-requests/booking",
  },
  {
    key: "quote",
    title: "Request Quote",
    description:
      "Request a quote for funeral services, packages or other services.",
    icon: "💰",
    href: "/client/service-requests/quote",
  },
  {
    key: "policy",
    title: "Policy Enquiry",
    description:
      "Ask a question about your policy, package or funeral cover.",
    icon: "📄",
    href: "/client/service-requests/policy",
  },
  {
    key: "payment",
    title: "Payment Enquiry",
    description:
      "Ask about premium payments, balances, receipts or outstanding amounts.",
    icon: "💳",
    href: "/client/service-requests/payment",
  },
  {
    key: "documents",
    title: "Documents",
    description:
      "Request policy documents, statements, receipts or other records.",
    icon: "📑",
    href: "/client/service-requests/documents",
  },
  {
    key: "support",
    title: "General Support",
    description:
      "Contact LegacyCare about something not covered by another service.",
    icon: "💬",
    href: "/client/service-requests/support",
  },
];

const trackingTypes:
  TrackingDefinition[] = [
  {
    key: "death",
    title: "Death Reports",
    icon: "🕊️",
    href: "/client/service-requests/death",
    actionLabel: "Report Death",
  },
  {
    key: "funeral",
    title: "Funeral",
    icon: "⚰️",
    href: "/client/service-requests/funeral",
    actionLabel: "New Funeral Request",
  },
  {
    key: "appointment",
    title: "Appointments",
    icon: "📅",
    href: "/client/service-requests/booking",
    actionLabel: "Book Appointment",
  },
  {
    key: "quote",
    title: "Quote Requests",
    icon: "💰",
    href: "/client/service-requests/quote",
    actionLabel: "Request Quote",
  },
  {
    key: "packageChange",
    title: "Change Package",
    icon: "🔄",
    href: "/client/policies",
    actionLabel: "Manage Policies",
  },
  {
    key: "beneficiaryChange",
    title: "Change Beneficiaries",
    icon: "👨‍👩‍👧",
    href: "/client/policies",
    actionLabel: "Manage Policies",
  },
  {
    key: "policy",
    title: "Policy Enquiries",
    icon: "📄",
    href: "/client/service-requests/policy",
    actionLabel: "New Enquiry",
  },
  {
    key: "payment",
    title: "Payment Enquiries",
    icon: "💳",
    href: "/client/service-requests/payment",
    actionLabel: "New Enquiry",
  },
  {
    key: "documents",
    title: "Document Requests",
    icon: "📑",
    href: "/client/service-requests/documents",
    actionLabel: "Request Documents",
  },
  {
    key: "support",
    title: "General Support",
    icon: "💬",
    href: "/client/service-requests/support",
    actionLabel: "New Support Request",
  },
];

const workflowStatuses:
  Record<ServiceKey, string[]> = {
  death: [
    "Pending",
    "Approved",
    "Rejected",
  ],

  funeral: [
    "Pending",
    "Approved",
    "Rejected",
  ],

  appointment: [
    "Requested",
    "Confirmed",
    "Rescheduled",
    "Completed",
    "Cancelled",
    "No Show",
  ],

  quote: [
    "Requested",
    "In Review",
    "Quoted",
    "Completed",
    "Rejected",
    "Cancelled",
  ],

  policy: [
    "Submitted",
    "In Review",
    "Responded",
    "Resolved",
    "Closed",
  ],

  payment: [
    "Submitted",
    "In Review",
    "Awaiting Client",
    "Resolved",
    "Closed",
  ],

  documents: [
    "Submitted",
    "Processing",
    "Ready",
    "Delivered",
    "Rejected",
    "Cancelled",
  ],

  support: [
    "Submitted",
    "In Progress",
    "Awaiting Client",
    "Resolved",
    "Closed",
  ],

  packageChange: [
    "Pending",
    "Approved",
    "Rejected",
  ],

  beneficiaryChange: [
    "Pending",
    "Approved",
    "Rejected",
  ],
};

function normalize(
  value?:
    | string
    | number
    | null
): string {
  return String(
    value ?? ""
  )
    .trim()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "")
    .toLowerCase();
}

function formatEnumText(
  value: string
): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function resolveNumericEnumValue(
  enumObject:
    Record<number, string>,
  value:
    | string
    | number
): string | null {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    Number.isNaN(
      numericValue
    )
  ) {
    return null;
  }

  return (
    enumObject[
      numericValue
    ] ?? null
  );
}

function getServiceKey(
  requestType: string
): ServiceKey {
  const type =
    normalize(
      requestType
    );

  if (
    type.includes(
      "death"
    )
  ) {
    return "death";
  }

  if (
    type.includes(
      "funeral"
    )
  ) {
    return "funeral";
  }

  if (
    type.includes(
      "appointment"
    )
  ) {
    return "appointment";
  }

  if (
    type.includes(
      "quote"
    )
  ) {
    return "quote";
  }

  if (
    type.includes(
      "policy"
    )
  ) {
    return "policy";
  }

  if (
    type.includes(
      "payment"
    )
  ) {
    return "payment";
  }

  if (
    type.includes(
      "document"
    )
  ) {
    return "documents";
  }

  return "support";
}

function getRequestStatusLabel(
  status:
    | string
    | number
): string {
  const numericLabel =
    resolveNumericEnumValue(
      RequestStatus as unknown as Record<
        number,
        string
      >,
      status
    );

  if (
    numericLabel
  ) {
    return formatEnumText(
      numericLabel
    );
  }

  return formatEnumText(
    String(status)
  );
}

function getAppointmentStatusLabel(
  status:
    | string
    | number
): string {
  const numericLabel =
    resolveNumericEnumValue(
      AppointmentStatus as unknown as Record<
        number,
        string
      >,
      status
    );

  if (
    numericLabel
  ) {
    return formatEnumText(
      numericLabel
    );
  }

  return formatEnumText(
    String(status)
  );
}

function getBeneficiaryRequestTypeLabel(
  requestType:
    | string
    | number
): string {
  const numericLabel =
    resolveNumericEnumValue(
      BeneficiaryRequestType as unknown as Record<
        number,
        string
      >,
      requestType
    );

  const label =
    numericLabel ??
    formatEnumText(
      String(
        requestType
      )
    );

  return `${formatEnumText(
    label
  )} Beneficiary`;
}

function getRelationshipLabel(
  relationship:
    | string
    | number
): string {
  const numericLabel =
    resolveNumericEnumValue(
      BeneficiaryRelationship as unknown as Record<
        number,
        string
      >,
      relationship
    );

  return numericLabel
    ? formatEnumText(
        numericLabel
      )
    : formatEnumText(
        String(
          relationship
        )
      );
}

function getServiceStatusLabel(
  service: ServiceKey,
  status:
    | string
    | number
): string {
  const enumMap:
    Partial<
      Record<
        ServiceKey,
        Record<
          number,
          string
        >
      >
    > = {
    death:
      DeathNotificationStatus as unknown as Record<
        number,
        string
      >,

    funeral:
      FuneralRequestStatus as unknown as Record<
        number,
        string
      >,

    appointment:
      AppointmentStatus as unknown as Record<
        number,
        string
      >,

    quote:
      QuoteRequestStatus as unknown as Record<
        number,
        string
      >,

    policy:
      PolicyEnquiryStatus as unknown as Record<
        number,
        string
      >,

    payment:
      PaymentEnquiryStatus as unknown as Record<
        number,
        string
      >,

    documents:
      DocumentRequestStatus as unknown as Record<
        number,
        string
      >,

    support:
      GeneralSupportStatus as unknown as Record<
        number,
        string
      >,

    packageChange:
      RequestStatus as unknown as Record<
        number,
        string
      >,

    beneficiaryChange:
      RequestStatus as unknown as Record<
        number,
        string
      >,
  };

  const numericLabel =
    enumMap[
      service
    ] !== undefined
      ? resolveNumericEnumValue(
          enumMap[
            service
          ]!,
          status
        )
      : null;

  if (
    numericLabel
  ) {
    return formatEnumText(
      numericLabel
    );
  }

  return formatEnumText(
    String(status)
  );
}

function getStatusStyle(
  status: string
): string {
  switch (
    normalize(
      status
    )
  ) {
    case "pending":
    case "requested":
    case "submitted":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "approved":
    case "confirmed":
    case "quoted":
    case "ready":
    case "responded":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "inreview":
    case "inprogress":
    case "processing":
    case "rescheduled":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "awaitingclient":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "completed":
    case "resolved":
    case "closed":
    case "delivered":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "cancelled":
    case "canceled":
    case "noshow":
      return "border-slate-300 bg-slate-100 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getPriorityStyle(
  priority: string
): string {
  return normalize(
    priority
  ) === "high"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-slate-200 bg-slate-100 text-slate-600";
}

function formatDate(
  value?:
    | string
    | null
): string {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
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

function formatTime(
  value?:
    | string
    | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-ZA",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function isRemoveBeneficiaryRequest(
  requestType:
    | string
    | number
): boolean {
  const numericLabel =
    resolveNumericEnumValue(
      BeneficiaryRequestType as unknown as Record<
        number,
        string
      >,
      requestType
    );

  return normalize(
    numericLabel ??
      String(
        requestType
      )
  ) === "remove";
}

function getHeartTheme(
  index: number
) {
  if (
    index % 2 === 0
  ) {
    return {
      border:
        "bg-teal-200 hover:bg-teal-400",

      inner:
        "bg-white group-hover:bg-teal-50",

      icon:
        "border-teal-200 bg-teal-100",

      action:
        "text-teal-700",
    };
  }

  return {
    border:
      "bg-pink-200 hover:bg-pink-400",

    inner:
      "bg-white group-hover:bg-pink-50",

    icon:
      "border-pink-200 bg-pink-100",

    action:
      "text-pink-700",
  };
}

export default function ServiceRequestsPage() {
  const searchParams =
    useSearchParams();

  const appointmentCreated =
    searchParams.get(
      "appointmentCreated"
    ) === "true";

  const quoteCreated =
    searchParams.get(
      "quoteCreated"
    ) === "true";

  const documentCreated =
    searchParams.get(
      "documentCreated"
    ) === "true";

  const supportCreated =
    searchParams.get(
      "supportCreated"
    ) === "true";

  const [
    serviceRequests,
    setServiceRequests,
  ] =
    useState<
      ServiceRequest[]
    >([]);

  const [
    appointments,
    setAppointments,
  ] =
    useState<
      AppointmentSummary[]
    >([]);

  const [
    packageChangeRequests,
    setPackageChangeRequests,
  ] =
    useState<
      PackageChangeRequest[]
    >([]);

  const [
    beneficiaryChangeRequests,
    setBeneficiaryChangeRequests,
  ] =
    useState<
      BeneficiaryChangeRequest[]
    >([]);

  const [
    branches,
    setBranches,
  ] =
    useState<
      Branch[]
    >([]);

  const [
    selectedService,
    setSelectedService,
  ] =
    useState<
      ServiceKey | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const createdRequestMessage =
    useMemo(() => {
      if (
        appointmentCreated
      ) {
        return {
          title:
            "Appointment booked successfully",

          message:
            "Your appointment was submitted and is waiting for Clerk review.",
        };
      }

      if (
        quoteCreated
      ) {
        return {
          title:
            "Quote request submitted successfully",

          message:
            "Your quote request is now available in My Requests and is waiting for Clerk review.",
        };
      }

      if (
        documentCreated
      ) {
        return {
          title:
            "Document request submitted successfully",

          message:
            "Your document request is now available in My Requests.",
        };
      }

      if (
        supportCreated
      ) {
        return {
          title:
            "Support request submitted successfully",

          message:
            "Your support request is now available in My Requests and is waiting for Clerk review.",
        };
      }

      return null;
    }, [
      appointmentCreated,
      quoteCreated,
      documentCreated,
      supportCreated,
    ]);

  useEffect(() => {
    document.title =
      "Service Requests | LegacyCare";

    if (
      appointmentCreated
    ) {
      setSelectedService(
        "appointment"
      );
      return;
    }

    if (
      quoteCreated
    ) {
      setSelectedService(
        "quote"
      );
      return;
    }

    if (
      documentCreated
    ) {
      setSelectedService(
        "documents"
      );
      return;
    }

    if (
      supportCreated
    ) {
      setSelectedService(
        "support"
      );
    }
  }, [
    appointmentCreated,
    quoteCreated,
    documentCreated,
    supportCreated,
  ]);

  async function loadServiceRequests(
    token: string
  ): Promise<void> {
    const response =
      await fetch(
        `${API_URL}/ServiceRequest/client`,
        {
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

    if (
      !response.ok
    ) {
      throw new Error(
        `Unable to load service requests (${response.status}).`
      );
    }

    const data =
      await response.json();

    setServiceRequests(
      Array.isArray(
        data
      )
        ? data
        : []
    );
  }

  async function loadAppointments(
    token: string
  ): Promise<void> {
    const response =
      await fetch(
        `${API_URL}/Appointment/my`,
        {
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

    if (
      !response.ok
    ) {
      setAppointments(
        []
      );

      return;
    }

    const data =
      await response.json();

    setAppointments(
      Array.isArray(
        data
      )
        ? data
        : []
    );
  }

  async function loadBranches(
    token: string
  ): Promise<void> {
    const response =
      await fetch(
        `${API_URL}/Branch`,
        {
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

    if (
      !response.ok
    ) {
      setBranches(
        []
      );

      return;
    }

    const data =
      await response.json();

    setBranches(
      Array.isArray(
        data
      )
        ? data
        : []
    );
  }

  async function loadPolicyRequests(
    token: string
  ): Promise<void> {
    const policiesResponse =
      await fetch(
        `${API_URL}/Policy/client`,
        {
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

    if (
      !policiesResponse.ok
    ) {
      setPackageChangeRequests(
        []
      );

      setBeneficiaryChangeRequests(
        []
      );

      return;
    }

    const policyData =
      await policiesResponse.json();

    const policies:
      PolicySummary[] =
      Array.isArray(
        policyData
      )
        ? policyData
        : [];

    const packageGroups =
      await Promise.all(
        policies.map(
          async (
            policy
          ) => {
            const response =
              await fetch(
                `${API_URL}/PackageChangeRequest/client/policy/${policy.policyId}`,
                {
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

            if (
              !response.ok
            ) {
              return [];
            }

            const data =
              await response.json();

            return Array.isArray(
              data
            )
              ? data
              : [];
          }
        )
      );

    const beneficiaryGroups =
      await Promise.all(
        policies.map(
          async (
            policy
          ) => {
            const response =
              await fetch(
                `${API_URL}/BeneficiaryRequest/client/policy/${policy.policyId}`,
                {
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

            if (
              !response.ok
            ) {
              return [];
            }

            const data =
              await response.json();

            return Array.isArray(
              data
            )
              ? data
              : [];
          }
        )
      );

    setPackageChangeRequests(
      packageGroups
        .flat()
        .sort(
          (
            left,
            right
          ) =>
            new Date(
              right.requestDate
            ).getTime() -
            new Date(
              left.requestDate
            ).getTime()
        )
    );

    setBeneficiaryChangeRequests(
      beneficiaryGroups
        .flat()
        .sort(
          (
            left,
            right
          ) =>
            new Date(
              right.requestDate
            ).getTime() -
            new Date(
              left.requestDate
            ).getTime()
        )
    );
  }

  async function loadAll(
    refresh =
      false
  ): Promise<void> {
    try {
      if (
        refresh
      ) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      setError("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      await Promise.all([
        loadServiceRequests(
          token
        ),

        loadAppointments(
          token
        ),

        loadBranches(
          token
        ),

        loadPolicyRequests(
          token
        ),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your requests."
      );
    } finally {
      setLoading(
        false
      );

      setRefreshing(
        false
      );
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const selectedDefinition =
    trackingTypes.find(
      (item) =>
        item.key ===
        selectedService
    );

  const selectedGenericRequests =
    useMemo(() => {
      if (
        !selectedService ||
        selectedService ===
          "appointment" ||
        selectedService ===
          "packageChange" ||
        selectedService ===
          "beneficiaryChange"
      ) {
        return [];
      }

      return serviceRequests.filter(
        (request) =>
          getServiceKey(
            request.requestType
          ) ===
          selectedService
      );
    }, [
      selectedService,
      serviceRequests,
    ]);

  const serviceCounts =
    useMemo(() => {
      const counts:
        Record<
          ServiceKey,
          number
        > = {
        death: 0,
        funeral: 0,

        appointment:
          appointments.length,

        quote: 0,
        policy: 0,
        payment: 0,
        documents: 0,
        support: 0,

        packageChange:
          packageChangeRequests.length,

        beneficiaryChange:
          beneficiaryChangeRequests.length,
      };

      for (
        const request
        of serviceRequests
      ) {
        const key =
          getServiceKey(
            request.requestType
          );

        if (
          key !==
          "appointment"
        ) {
          counts[
            key
          ] += 1;
        }
      }

      return counts;
    }, [
      appointments,
      packageChangeRequests,
      beneficiaryChangeRequests,
      serviceRequests,
    ]);

  const statusSummary =
    useMemo<
      StatusSummaryItem[]
    >(() => {
      if (
        !selectedService
      ) {
        return [];
      }

      const orderedStatuses =
        workflowStatuses[
          selectedService
        ];

      let actualStatuses:
        string[] = [];

      if (
        selectedService ===
        "appointment"
      ) {
        actualStatuses =
          appointments.map(
            (
              appointment
            ) =>
              getAppointmentStatusLabel(
                appointment.status
              )
          );
      } else if (
        selectedService ===
        "packageChange"
      ) {
        actualStatuses =
          packageChangeRequests.map(
            (
              request
            ) =>
              getRequestStatusLabel(
                request.status
              )
          );
      } else if (
        selectedService ===
        "beneficiaryChange"
      ) {
        actualStatuses =
          beneficiaryChangeRequests.map(
            (
              request
            ) =>
              getRequestStatusLabel(
                request.status
              )
          );
      } else {
        actualStatuses =
          selectedGenericRequests.map(
            (
              request
            ) =>
              getServiceStatusLabel(
                selectedService,
                request.status
              )
          );
      }

      return orderedStatuses.map(
        (
          label
        ) => ({
          label,

          count:
            actualStatuses.filter(
              (
                status
              ) =>
                normalize(
                  status
                ) ===
                normalize(
                  label
                )
            ).length,
        })
      );
    }, [
      selectedService,
      appointments,
      packageChangeRequests,
      beneficiaryChangeRequests,
      selectedGenericRequests,
    ]);

  const selectedTotal =
    useMemo(() => {
      if (
        selectedService ===
        "appointment"
      ) {
        return appointments.length;
      }

      if (
        selectedService ===
        "packageChange"
      ) {
        return packageChangeRequests.length;
      }

      if (
        selectedService ===
        "beneficiaryChange"
      ) {
        return beneficiaryChangeRequests.length;
      }

      return selectedGenericRequests.length;
    }, [
      selectedService,
      appointments,
      packageChangeRequests,
      beneficiaryChangeRequests,
      selectedGenericRequests,
    ]);

  function getBranchName(
    request:
      ServiceRequest
  ): string {
    if (
      request.branchName
    ) {
      return request.branchName;
    }

    if (
      !request.branchId
    ) {
      return "Not specified";
    }

    const branch =
      branches.find(
        (
          item
        ) =>
          normalize(
            item.branchId
          ) ===
          normalize(
            request.branchId
          )
      );

    return (
      branch?.branchName ||
      request.branchId
    );
  }

  const hasSelectedRequests =
    selectedTotal > 0;

  return (
    <div className="-m-6 min-h-screen bg-slate-100 p-6 text-slate-900 md:-m-8 md:p-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-600">
                LegacyCare
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Service Requests
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Start services and track every request using its correct workflow status.
              </p>
            </div>

            <Link
              href="/client"
              className="text-sm font-semibold text-teal-600 transition hover:text-teal-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {createdRequestMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl">
                ✅
              </span>

              <div>
                <h2 className="font-semibold text-emerald-900">
                  {
                    createdRequestMessage.title
                  }
                </h2>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  {
                    createdRequestMessage.message
                  }
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            Start a Request
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Package and beneficiary changes are managed under My Policies.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {startRequestTypes.map(
              (
                service,
                index
              ) => {
                const theme =
                  getHeartTheme(
                    index
                  );

                return (
                  <Link
                    key={
                      service.key
                    }
                    href={
                      service.href
                    }
                    className={`group relative mx-auto flex h-[300px] w-full max-w-[300px] items-center justify-center p-[2px] transition duration-300 hover:-translate-y-2 hover:drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)] ${theme.border}`}
                    style={{
                      clipPath:
                        "polygon(50% 96%, 8% 58%, 2% 39%, 4% 22%, 14% 9%, 28% 4%, 40% 8%, 50% 20%, 60% 8%, 72% 4%, 86% 9%, 96% 22%, 98% 39%, 92% 58%)",
                    }}
                  >
                    <div
                      className={`flex h-full w-full flex-col items-center justify-center px-8 pb-14 pt-12 text-center transition ${theme.inner}`}
                      style={{
                        clipPath:
                          "polygon(50% 96%, 8% 58%, 2% 39%, 4% 22%, 14% 9%, 28% 4%, 40% 8%, 50% 20%, 60% 8%, 72% 4%, 86% 9%, 96% 22%, 98% 39%, 92% 58%)",
                      }}
                    >
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full border text-3xl ${theme.icon}`}
                      >
                        {
                          service.icon
                        }
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        {
                          service.title
                        }
                      </h3>

                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                        {
                          service.description
                        }
                      </p>

                      <span
                        className={`mt-4 text-sm font-bold ${theme.action}`}
                      >
                        Start →
                      </span>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                My Requests
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Each service keeps its own request workflow and statuses.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadAll(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-14 text-center text-sm text-slate-500">
                Loading your requests...
              </div>
            ) : null}

            {!loading &&
            error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {!loading &&
            !error ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {trackingTypes.map(
                    (
                      service
                    ) => {
                      const active =
                        selectedService ===
                        service.key;

                      return (
                        <button
                          key={
                            service.key
                          }
                          type="button"
                          onClick={() =>
                            setSelectedService(
                              service.key
                            )
                          }
                          className={`rounded-2xl border p-5 text-left transition ${
                            active
                              ? "border-teal-500 bg-teal-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-2xl">
                              {
                                service.icon
                              }
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                active
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {
                                serviceCounts[
                                  service.key
                                ]
                              }
                            </span>
                          </div>

                          <p className="mt-4 text-sm font-bold text-slate-900">
                            {
                              service.title
                            }
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>

                {!selectedService ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <h3 className="font-semibold text-slate-900">
                      Select a request type
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Choose a service above to view its request history and workflow.
                    </p>
                  </div>
                ) : null}

                {selectedService &&
                selectedDefinition ? (
                  <div className="mt-10 space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {
                            selectedDefinition.icon
                          }{" "}
                          {
                            selectedDefinition.title
                          }
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Track every status in this workflow.
                        </p>
                      </div>

                      <Link
                        href={
                          selectedDefinition.href
                        }
                        className="rounded-xl bg-teal-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-teal-700"
                      >
                        {
                          selectedDefinition.actionLabel
                        }
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                      <StatusSummaryCard
                        label="Total"
                        count={
                          selectedTotal
                        }
                      />

                      {statusSummary.map(
                        (
                          item
                        ) => (
                          <StatusSummaryCard
                            key={
                              item.label
                            }
                            label={
                              item.label
                            }
                            count={
                              item.count
                            }
                          />
                        )
                      )}
                    </div>

                    {!hasSelectedRequests ? (
                      <EmptyState
                        title={`No ${selectedDefinition.title.toLowerCase()} yet`}
                        description="New requests will appear here once submitted."
                        href={
                          selectedDefinition.href
                        }
                        actionLabel={
                          selectedDefinition.actionLabel
                        }
                      />
                    ) : null}

                    {selectedService ===
                      "packageChange" &&
                      packageChangeRequests.map(
                        (
                          request
                        ) => (
                          <RequestCard
                            key={
                              request.requestId
                            }
                          >
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
                                Package Change
                              </p>

                              <h4 className="mt-2 font-semibold text-slate-900">
                                Policy{" "}
                                {
                                  request.policyId
                                }
                              </h4>

                              <p className="mt-2 text-sm text-slate-600">
                                New package:{" "}
                                <strong className="text-slate-900">
                                  {request
                                    .newPackage
                                    ?.name ||
                                    request.newPackageId}
                                </strong>
                              </p>

                              <p className="mt-3 text-xs text-slate-400">
                                Submitted{" "}
                                {formatDate(
                                  request.requestDate
                                )}{" "}
                                {formatTime(
                                  request.requestDate
                                )}
                              </p>
                            </div>

                            <StatusBadge
                              label={getRequestStatusLabel(
                                request.status
                              )}
                            />
                          </RequestCard>
                        )
                      )}

                    {selectedService ===
                      "beneficiaryChange" &&
                      beneficiaryChangeRequests.map(
                        (
                          request
                        ) => (
                          <RequestCard
                            key={
                              request.requestId
                            }
                          >
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-pink-600">
                                {getBeneficiaryRequestTypeLabel(
                                  request.requestType
                                )}
                              </p>

                              <h4 className="mt-2 font-semibold text-slate-900">
                                Policy{" "}
                                {
                                  request.policyId
                                }
                              </h4>

                              <p className="mt-2 text-sm text-slate-600">
                                Beneficiary:{" "}
                                <strong className="text-slate-900">
                                  {request.fullName ||
                                    request
                                      .beneficiary
                                      ?.fullName ||
                                    request.beneficiaryId ||
                                    "Existing beneficiary"}
                                </strong>
                              </p>

                              {!isRemoveBeneficiaryRequest(
                                request.requestType
                              ) ? (
                                <p className="mt-1 text-sm text-slate-500">
                                  Relationship:{" "}
                                  {getRelationshipLabel(
                                    request.relationship
                                  )}
                                </p>
                              ) : null}

                              {request.description ? (
                                <p className="mt-2 text-sm text-slate-500">
                                  {
                                    request.description
                                  }
                                </p>
                              ) : null}

                              <p className="mt-3 text-xs text-slate-400">
                                Submitted{" "}
                                {formatDate(
                                  request.requestDate
                                )}
                              </p>
                            </div>

                            <StatusBadge
                              label={getRequestStatusLabel(
                                request.status
                              )}
                            />
                          </RequestCard>
                        )
                      )}

                    {selectedService ===
                      "appointment" &&
                      appointments.map(
                        (
                          appointment
                        ) => {
                          const scheduled =
                            appointment.confirmedDateTime ||
                            appointment.preferredDateTime;

                          return (
                            <RequestCard
                              key={
                                appointment.appointmentId
                              }
                            >
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
                                  Appointment
                                </p>

                                <h4 className="mt-2 font-semibold text-slate-900">
                                  {
                                    appointment.appointmentType
                                  }
                                </h4>

                                <p className="mt-2 text-sm text-slate-600">
                                  {formatDate(
                                    scheduled
                                  )}{" "}
                                  {formatTime(
                                    scheduled
                                  )}
                                </p>

                                {appointment.clientNotes ? (
                                  <p className="mt-2 text-sm text-slate-500">
                                    {
                                      appointment.clientNotes
                                    }
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <StatusBadge
                                  label={getAppointmentStatusLabel(
                                    appointment.status
                                  )}
                                />

                                <span
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPriorityStyle(
                                    appointment.priority
                                  )}`}
                                >
                                  {
                                    appointment.priority
                                  }{" "}
                                  Priority
                                </span>

                                <Link
                                  href={`/client/service-requests/${appointment.serviceRequestId}`}
                                  className="rounded-xl border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                                >
                                  View Details
                                </Link>
                              </div>
                            </RequestCard>
                          );
                        }
                      )}

                    {selectedService !==
                      "appointment" &&
                      selectedService !==
                        "packageChange" &&
                      selectedService !==
                        "beneficiaryChange" &&
                      selectedGenericRequests.map(
                        (
                          request
                        ) => (
                          <RequestCard
                            key={
                              request.serviceRequestId
                            }
                          >
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
                                {formatEnumText(
                                  request.requestType
                                )}
                              </p>

                              <h4 className="mt-2 font-semibold text-slate-900">
                                REQ-
                                {String(
                                  request.serviceRequestId
                                ).padStart(
                                  5,
                                  "0"
                                )}
                              </h4>

                              <p className="mt-2 text-sm text-slate-600">
                                Branch:{" "}
                                {getBranchName(
                                  request
                                )}
                              </p>

                              {request.description ? (
                                <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-slate-500">
                                  {
                                    request.description
                                  }
                                </p>
                              ) : null}

                              {selectedService ===
                              "death" ? (
                                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                                  <p className="text-sm text-blue-700">
                                    For changes, contact LegacyCare Admin:{" "}
                                    <strong>
                                      {
                                        LEGACYCARE_CONTACT_NUMBER
                                      }
                                    </strong>
                                  </p>
                                </div>
                              ) : null}

                              <p className="mt-3 text-xs text-slate-400">
                                Submitted{" "}
                                {formatDate(
                                  request.createdDate
                                )}{" "}
                                {formatTime(
                                  request.createdDate
                                )}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <StatusBadge
                                label={getServiceStatusLabel(
                                  selectedService,
                                  request.status
                                )}
                              />

                              <span
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPriorityStyle(
                                  request.priority
                                )}`}
                              >
                                {
                                  request.priority
                                }{" "}
                                Priority
                              </span>

                              <Link
                                href={`/client/service-requests/${request.serviceRequestId}`}
                                className="rounded-xl border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                              >
                                View Details
                              </Link>
                            </div>
                          </RequestCard>
                        )
                      )}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusSummaryCard({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${getStatusStyle(
        label
      )}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {count}
      </p>
    </div>
  );
}

function RequestCard({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md lg:flex-row lg:items-center">
      {children}
    </div>
  );
}

function StatusBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span
      className={`h-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
        label
      )}`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <h3 className="font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}