"use client";

import { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import EventDetails from "@/components/modals/admin/schedule/EventDetails";
import ScheduleMetricCard from "@/components/dashboard/metriccard/admin/ScheduleMetricCard";
import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";

interface Event {
  eventId: string;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  venue: string;
  status: string;
  clientId: string;
  client?: {
    fullName: string;
    email: string;
  };
  deceased?: {
    fullName: string;
  };
  staffMembers?: Array<{
    user: {
      fullName: string;
    };
  }>;
}

export default function SchedulePage() {
  useEffect(() => {
    document.title = "Manage Events";
  }, []);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`${API_BASE_URL}/Event`);
      
      if (!response.ok) {
        throw new Error("Failed to load events");
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const columns = [
    {
      key: "eventId",
      label: "Event ID",
      render: (row: Event) => (
        <span className="font-medium text-gray-900">
          {row.eventId.substring(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "eventType",
      label: "Event Type",
      render: (row: Event) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          row.eventType === "Funeral" ? "bg-gray-100 text-gray-700" :
          row.eventType === "Memorial" ? "bg-blue-100 text-blue-700" :
          row.eventType === "Appointment" ? "bg-green-100 text-green-700" :
          "bg-purple-100 text-purple-700"
        }`}>
          {row.eventType || "N/A"}
        </span>
      ),
    },
    {
      key: "title",
      label: "Event Name",
      render: (row: Event) => (
        <div>
          <div className="font-medium text-gray-900">{row.title}</div>
          <div className="text-sm text-gray-500">{row.description?.substring(0, 50)}...</div>
        </div>
      ),
    },
    {
      key: "venue",
      label: "Location",
      render: (row: Event) => (
        <span>{row.venue || "N/A"}</span>
      ),
    },
    {
      key: "eventDate",
      label: "Date & Time",
      render: (row: Event) => (
        <div>
          <div>{formatDate(row.eventDate)}</div>
          <div className="text-sm text-gray-500">
            {new Date(row.eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: Event) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          row.status === "Scheduled" ? "bg-yellow-100 text-yellow-700" :
          row.status === "Completed" ? "bg-green-100 text-green-700" :
          row.status === "Cancelled" ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {row.status || "Scheduled"}
        </span>
      ),
    },
  ];

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedEventId(event.eventId);
  };

  const totalEvents = events.length;
  const totalFuneral = events.filter(e => e.eventType === "Funeral").length;
  const totalMemorial = events.filter(e => e.eventType === "Memorial").length;
  const totalAppointments = events.filter(e => e.eventType === "Appointment").length;
  const totalParlour = events.filter(e => e.eventType === "ParlourRelated").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manage Events" />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manage Events" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Error loading events</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadEvents}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manage Events" />
      
      <ScheduleMetricCard
        totEvent={totalEvents}
        totFuneral={totalFuneral}
        totMemorial={totalMemorial}
        totAppointments={totalAppointments}
        totParlour={totalParlour}
      />
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ComponentCard title="Events">
            {events.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No events found</p>
              </div>
            ) : (
              <ReusableTable
                columns={columns}
                data={events}
                onRowClick={handleViewEvent}
              />
            )}
          </ComponentCard>
        </div>

        <div className="col-span-4">
          <ComponentCard title="Event Details">
            {selectedEvent ? (
              <EventDetails
                event={selectedEvent}
              />
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">Select an event to view details</p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}