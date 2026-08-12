"use client";

interface EventDetailsProps {
  event: {
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
  };
}

export default function EventDetails({ event }: EventDetailsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "text-yellow-600 bg-yellow-100";
      case "Completed": return "text-green-600 bg-green-100";
      case "Cancelled": return "text-red-600 bg-red-100";
      case "Postponed": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Funeral": return "text-gray-700 bg-gray-100";
      case "Memorial": return "text-blue-700 bg-blue-100";
      case "Appointment": return "text-green-700 bg-green-100";
      case "ParlourRelated": return "text-purple-700 bg-purple-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(event.status)}`}>
          {event.status || "Scheduled"}
        </span>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
          {event.eventType || "N/A"}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        {event.description && (
          <p className="mt-1 text-sm text-gray-600">{event.description}</p>
        )}
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(event.eventDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="text-sm font-medium text-gray-900">{formatTime(event.eventDate)}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500">Location</p>
        <p className="text-sm font-medium text-gray-900">{event.venue || "N/A"}</p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Client</p>
        <p className="text-sm font-medium text-gray-900">
          {event.client?.fullName || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Deceased</p>
        <p className="text-sm font-medium text-gray-900">
          {event.deceased?.fullName || "N/A"}
        </p>
      </div>

      {event.staffMembers && event.staffMembers.length > 0 && (
        <div>
          <p className="text-xs text-gray-500">Staff Assigned</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {event.staffMembers.map((staff, index) => (
              <span key={index} className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                {staff.user?.fullName || "Staff"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}