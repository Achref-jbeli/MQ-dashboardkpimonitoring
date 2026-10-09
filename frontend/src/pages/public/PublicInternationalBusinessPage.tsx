import { useEffect, useState } from "react";
import { SearchInput } from "../../components/common/SearchInput";
import { BusinessCard } from "../../components/internationalBusiness/BusinessCard";
import { M } from "../../theme/tokens";
import {
  getPublicInternationalBusinesses,
  type PublicInternationalBusiness,
} from "../../api/publicDashboardApi";
import { Globe2 } from "lucide-react";

export function PublicInternationalBusinessPage({
  departmentId,
}: {
  departmentId: number;
}) {
  const [businesses, setBusinesses] = useState<PublicInternationalBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getPublicInternationalBusinesses(departmentId);
        if (!cancelled) {
          setBusinesses(data);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching international businesses:", err);
        if (!cancelled) setError("Failed to load international businesses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  const filtered = businesses.filter((business) => {
    const query = search.toLowerCase();
    return (
      (business.name ?? "").toLowerCase().includes(query) ||
      (business.partnerName ?? "").toLowerCase().includes(query) ||
      (business.country ?? "").toLowerCase().includes(query) ||
      (business.description ?? "").toLowerCase().includes(query) ||
      (business.projectInfo ?? "").toLowerCase().includes(query) ||
      (business.productionLocation ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Filter & Count Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 260, maxWidth: 500 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, partner, country, project info..."
          />
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 12,
            background: "var(--surface-secondary, #EEF4F7)",
            border: `1px solid ${M.border}`,
            fontSize: 12,
            fontWeight: 700,
            color: M.textPrimary,
          }}
        >
          <Globe2 size={15} color={M.teal} />
          <span>
            {filtered.length} International Business{filtered.length === 1 ? "" : "es"}
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: M.dangerBg,
            color: M.dangerText,
            border: `1px solid ${M.border}`,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            color: M.textSec,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Loading international business opportunities...
        </div>
      ) : (
        <>
          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gridAutoRows: "1fr",
                gap: 22,
              }}
            >
              {filtered.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                borderRadius: 16,
                background: "var(--card, #FFFFFF)",
                border: `1px dashed ${M.border}`,
                textAlign: "center",
                gap: 10,
              }}
            >
              <Globe2 size={36} color={M.textSec} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: M.textPrimary, margin: 0 }}>
                No International Businesses Found
              </h3>
              <p style={{ fontSize: 13, color: M.textSec, margin: 0, maxWidth: 400 }}>
                {search
                  ? "No businesses matched your search criteria. Try a different query."
                  : "There are currently no active public international business opportunities for this department."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}