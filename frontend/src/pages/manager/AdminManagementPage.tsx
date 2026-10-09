import { Shield } from "lucide-react";
import AccountRequestsSection from "../../components/settings/AccountRequestsSection";
import { M } from "../../theme/tokens";

export function AdminManagementPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          background: M.white,
          borderRadius: 20,
          border: `1px solid ${M.border}`,
          padding: 18,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Shield size={20} color={M.teal} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: M.textPrimary }}>Administrator Requests</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: M.textSec }}>
            Managers can approve or reject administrator account requests in their department.
          </p>
        </div>
      </div>

      <AccountRequestsSection
        scope="manager"
        title="Pending Administrator Requests"
        subtitle="Department-scoped requests awaiting manager decision."
      />
    </div>
  );
}
