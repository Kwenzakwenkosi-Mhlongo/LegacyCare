import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://10.0.2.2:5224/api";

async function getToken() {
  return await AsyncStorage.getItem("TOKEN_KEY");
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = await getToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to communicate with the server."
    );
  }

  return data;
}

/*
 * ================================================================
 * GET PENDING FUNERAL REQUESTS
 * ================================================================
 */

export async function getPendingFuneralRequests() {
  return apiRequest(
    "/FuneralRequest/clerk/pending"
  );
}

/*
 * ================================================================
 * GET FUNERAL REQUEST
 * ================================================================
 */

export async function getFuneralRequest(
  id: string
) {
  return apiRequest(
    `/FuneralRequest/${id}`
  );
}

/*
 * ================================================================
 * REVIEW FUNERAL REQUEST
 * ================================================================
 */

export async function reviewFuneralRequest(
  id: string,
  action: "Approve" | "Reject",
  staffRequired: number,
  rejectionReason?: string
) {
  return apiRequest(
    `/FuneralRequest/clerk/${id}/review`,
    {
      method: "PUT",

      body: JSON.stringify({
        action,
        staffRequired,
        rejectionReason:
          rejectionReason || null,
      }),
    }
  );
}