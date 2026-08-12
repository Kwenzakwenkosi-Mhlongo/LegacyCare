import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/Task`;

export async function getTasks() {
  const response = await apiFetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

export async function getTaskById(taskId: string) {
  const response = await apiFetch(`${API_URL}/${taskId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch task");
  }
  return response.json();
}

export async function createTask(data: any) {
  let dueDate = data.dueDate;
  if (dueDate) {
    const dateObj = new Date(dueDate);
    if (!isNaN(dateObj.getTime())) {
      dueDate = dateObj.toISOString();
    }
  }

  const formattedData = {
    title: data.title,
    description: data.description || "",
    dueDate: dueDate || new Date().toISOString(),
    assignedToId: data.assignedToId || data.staffId,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
    policyId: data.policyId || null,
    deceasedId: data.deceasedId || null,
    eventId: data.eventId || null,
  };

  const response = await apiFetch(API_URL, {
    method: "POST",
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to create task");
  }
  return response.json();
}

export async function updateTask(taskId: string, data: any) {
  let dueDate = data.dueDate;
  if (dueDate) {
    const dateObj = new Date(dueDate);
    if (!isNaN(dateObj.getTime())) {
      dueDate = dateObj.toISOString();
    }
  }

  const formattedData = {
    title: data.title,
    description: data.description || "",
    dueDate: dueDate || null,
    assignedToId: data.assignedToId || data.staffId,
    policyId: data.policyId || null,
    deceasedId: data.deceasedId || null,
    eventId: data.eventId || null,
  };

  const response = await apiFetch(`${API_URL}/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update task");
  }
  return response.json();
}

export async function deleteTask(taskId: string) {
  const response = await apiFetch(`${API_URL}/${taskId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
}

export async function updateTaskStatus(taskId: string, status: number) {
  const response = await apiFetch(`${API_URL}/${taskId}/status?status=${status}`, {
    method: "PUT",
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update task status");
  }
}