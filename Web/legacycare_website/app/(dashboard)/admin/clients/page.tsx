"use client";

import { useState } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import Pagination from "@/components/tables/Pagination";
import ClientDetails from "@/components/modals/admin/client/ClientDetails";
import EditClientDetails from "@/components/modals/admin/client/EditClientDetails";
import DeleteConfirmation from "@/components/modals/confirmation/DeleteConfirmation";

import {
  getClients,
  updateClient,
  deactivateClient,
  activateClient,
} from "@/lib/clientService";
import Link from "next/link";
import React from "react";

export default function ClientsPage() {
  /* ---------------- STATES ---------------- */
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = React.useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [editClient, setEditClient] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  /* ---------------- EFFECTS ---------------- */
  React.useEffect(() => {
    document.title = "Manage Clients";
  }, []);

  React.useEffect(() => {
    loadClients();
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* ---------------- TABLE HEADINGS ---------------- */
  const columns = [
    {
      key: "client",
      label: "Client",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center font-semibold text-cyan-700">
            {row.initials}
          </div>

          <div>
            <div className="font-medium text-gray-900">{row.fullName}</div>
            <div className="text-sm text-gray-500">
              {row.displayClientId}
            </div>
          </div>
        </div>
      ),
    },
    { key: "cellNo", label: "Phone Number" },
    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            row.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { key: "options", label: "Options" },
  ];

  /* ---------------- FUNCTIONS ---------------- */
  const loadClients = async () => {
    try {
      const data = await getClients();

      const mappedClients = data
        .map((client: any) => ({
          clientId: client.clientId,
          displayClientId: client.displayClientId,
          fullName: client.user?.fullName,
          idNumber: client.user?.idNumber,
          cellNo: client.user?.cellNo,
          email: client.user?.email,
          address: client.user?.address,
          initials: client.user?.fullName
            ?.split(" ")
            .map((n: string) => n[0])
            .join(""),
          status: client.user?.isActive ? "Active" : "Inactive",
          registered: client.user?.dateCreated
            ? client.user.dateCreated.split("T")[0]
            : "",
        }))
        .sort((a: any, b: any) => Number(a.clientId) - Number(b.clientId));

      setClients(mappedClients);
      return mappedClients;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = [
      client.displayClientId,
      client.fullName,
      client.idNumber,
      client.cellNo,
      client.email,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setSelectedClientId(client.clientId);
    setEditClient(false);
  };

  const handleEditClient = () => {
    setEditClient(true);
  };

  const handleSaveClient = async (updatedClient: any) => {
    try {
      await updateClient(updatedClient.clientId, {
        fullName: updatedClient.fullName,
        idNumber: updatedClient.idNumber,
        email: updatedClient.email,
        cellNo: updatedClient.cellNo,
        address: updatedClient.address,
        isActive: updatedClient.status === "Active",
      });

      const refreshedClients = await loadClients();
      const refreshedClient = refreshedClients.find(
        (c: any) => c.clientId === updatedClient.clientId
      );

      if (refreshedClient) {
        setSelectedClient(refreshedClient);
      }
      setEditClient(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleDeactivateClient = async () => {
    if (!selectedClient) return;

    try {
      await deactivateClient(selectedClient.clientId);

      const refreshedClients = await loadClients();
      const refreshedClient = refreshedClients.find(
        (c: any) => c.clientId === selectedClient.clientId
      );

      if (refreshedClient) {
        setSelectedClient(refreshedClient);
      }
      setDeleteModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleActivateClient = async () => {
    if (!selectedClient) return;

    try {
      await activateClient(selectedClient.clientId);

      const refreshedClients = await loadClients();
      const refreshedClient = refreshedClients.find(
        (c: any) => c.clientId === selectedClient.clientId
      );

      if (refreshedClient) {
        setSelectedClient(refreshedClient);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageBreadcrumb pageTitle="Manage Clients" />

      {/* TABLE + DETAILS PANEL */}
      <div className="grid grid-cols-12 gap-6">
        {/* TABLE */}
        <div className="col-span-8">
          <ComponentCard title="Clients">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search Clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="All">All Clients</option>
                  <option value="Active">Active Clients</option>
                  <option value="Inactive">Inactive Clients</option>
                </select>
              </div>

              <Link
                href="/admin/clients/create"
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                + Add New Client
              </Link>
            </div>

            <p className="mb-2 text-sm text-gray-500">
              Showing {filteredClients.length} of {clients.length} clients
            </p>

            <ReusableTable
              columns={columns}
              data={currentClients}
              onRowClick={handleViewClient}
              onEdit={(client) => {
                setSelectedClient(client);
                setEditClient(true);
              }}
              onDelete={(client) => {
                setSelectedClient(client);
                setDeleteModal(true);
              }}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </ComponentCard>
        </div>

        {/* DETAILS PANEL */}
        <div className="col-span-4">
          <ComponentCard title={editClient ? "Edit Client" : "Client Details"}>
            {selectedClient ? (
              editClient ? (
                <EditClientDetails
                  client={selectedClient}
                  onCancel={() => setEditClient(false)}
                  onSave={handleSaveClient}
                />
              ) : (
                <ClientDetails
                  client={selectedClient}
                  onEdit={handleEditClient}
                  onDeactivate={handleDeactivateClient}
                  onActivate={handleActivateClient}
                />
              )
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Select a client to view details
                </p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      <DeleteConfirmation
        isOpen={deleteModal}
        itemName={selectedClient?.fullName}
        onCancel={() => setDeleteModal(false)}
        onConfirm={handleDeactivateClient}
      />
    </div>
  );
}
