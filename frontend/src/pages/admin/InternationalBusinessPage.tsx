import { useEffect, useState } from "react";

import { Button } from "../../components/common/Button";
import { SearchInput } from "../../components/common/SearchInput";

import { InternationalBusinessTable } from "../../components/internationalBusiness/InternationalBusinessTable";
import { InternationalBusinessModal } from "../../components/internationalBusiness/InternationalBusinessModal";
import { getActiveDepartmentId } from "../../utils/departmentScope";

import type { InternationalBusinessFormValues } from "../../components/internationalBusiness/InternationalBusinessForm";
import type { InternationalBusiness } from "../../types/internationalBusiness";

import {
  getInternationalBusinesses,
  createInternationalBusiness,
  updateInternationalBusiness,
  deleteInternationalBusiness,
} from "../../api/internationalBusinessApi";

export function InternationalBusinessPage() {
  const departmentId = getActiveDepartmentId() ?? undefined;

  const [businesses, setBusinesses] = useState<InternationalBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<InternationalBusiness | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const data = await getInternationalBusinesses(departmentId);      setBusinesses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching international businesses:", error);
      setError("Failed to load international businesses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const filtered = businesses.filter((business) => {
    const query = search.toLowerCase();
    return (
      (business.name ?? "").toLowerCase().includes(query) ||
      (business.partnerName ?? "").toLowerCase().includes(query) ||
      (business.country ?? "").toLowerCase().includes(query) ||
      (business.description ?? "").toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (values: InternationalBusinessFormValues) => {
    // No departmentId here — matches ProjectsPage. The backend
    // resolves/assigns it from the authenticated user's claims.
    const businessData = {
      name: values.name,
      partnerName: values.partnerName,
      country: values.country,
      description: values.description,
      photos: values.photos,
      isPublicActive: values.isPublicActive,
      isNewBusiness: values.isNewBusiness,
      projectInfo: values.projectInfo,
      volumeLifetime: values.volumeLifetime,
      salesLifetime: values.salesLifetime,
      sop: values.sop,
      productionLocation: values.productionLocation,
    };

    try {
      if (editing) {
         const updated = await updateInternationalBusiness(editing.id, businessData, departmentId);
        setBusinesses((prev) =>
          prev.map((business) => (business.id === editing.id ? updated : business))
        );
      } else {
         const created = await createInternationalBusiness(businessData, departmentId);
        setBusinesses((prev) => [...prev, created]);
      }
      setShowModal(false);
      setEditing(null);
      setError(null);
    } catch (error) {
      console.error("Error saving international business:", error);
      setError("Failed to save international business.");
    }
  };

  const handleDelete = async (business: InternationalBusiness) => {
    if (!confirm(`Delete international business "${business.name}"?`)) return;

    try {
      await deleteInternationalBusiness(business.id, departmentId);
      setBusinesses((prev) => prev.filter((item) => item.id !== business.id));
    } catch (error) {
      console.error("Error deleting international business:", error);
      setError("Failed to delete international business.");
    }
  };

  const handleTogglePublic = async (business: InternationalBusiness) => {
    try {
      const updated = await updateInternationalBusiness(
        business.id,
        { isPublicActive: !business.isPublicActive },
        departmentId
      );
      setBusinesses((prev) =>
        prev.map((b) => (b.id === business.id ? updated : b))
      );
    } catch {
      setError("Failed to update visibility.");
    }
  };

  const handleToggleNew = async (business: InternationalBusiness) => {
    try {
      const updated = await updateInternationalBusiness(
        business.id,
        { isNewBusiness: !business.isNewBusiness },
        departmentId
      );
      setBusinesses((prev) =>
        prev.map((b) => (b.id === business.id ? updated : b))
      );
    } catch {
      setError("Failed to update new status.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search international businesses..."
        />
        <Button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + Add Request for Quotation
        </Button>
      </div>

      {error && <p style={{ color: "#B91C1C", fontSize: 12, margin: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ fontSize: 13 }}>Loading international businesses...</p>
      ) : (
        <InternationalBusinessTable
          businesses={filtered}
          onEdit={(business) => {
            setEditing(business);
            setShowModal(true);
          }}
          onDelete={handleDelete}
          onTogglePublic={handleTogglePublic}
          onToggleNew={handleToggleNew}
        />
      )}

      {showModal && (
        <InternationalBusinessModal
          internationalBusiness={editing ?? undefined}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}