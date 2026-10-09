import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Loader2, MailCheck, ShieldAlert, XCircle } from "lucide-react";

import { M } from "../../theme/tokens";
import {
  approveAccountRequest,
  getAccountRequests,
  rejectAccountRequest,
  type AccountRequestItem,
  type AccountRequestScope,
} from "../../api/authApi";

interface AccountRequestsSectionProps {
  scope?: AccountRequestScope;
  title?: string;
  subtitle?: string;
}

export default function AccountRequestsSection({
  scope = "admin",
  title = "Account Requests",
  subtitle = "Review and process account requests in your department.",
}: AccountRequestsSectionProps) {
  const [items, setItems] = useState<AccountRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const reviewerId = Number(localStorage.getItem("employeeId")) || undefined;

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAccountRequests(scope);
      setItems(result);
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Failed to load account requests.");
      } else {
        setError("Failed to load account requests.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [scope]);

  const handleApprove = async (requestId: number) => {
    setBusyId(requestId);
    try {
      await approveAccountRequest(requestId, reviewerId, scope);
      await loadData();
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Failed to approve request.");
      } else {
        setError("Failed to approve request.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    const reason = window.prompt("Optional rejection reason:");

    setBusyId(requestId);
    try {
      await rejectAccountRequest(requestId, reason || undefined, reviewerId, scope);
      await loadData();
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Failed to reject request.");
      } else {
        setError("Failed to reject request.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const statusStyle = (status: string) => {
    if (status === "Approved") {
      return {
        color: M.success,
        background: `${M.success}14`,
        border: `${M.success}40`,
      };
    }

    if (status === "Rejected") {
      return {
        color: M.danger,
        background: `${M.danger}14`,
        border: `${M.danger}40`,
      };
    }

    return {
      color: M.warning,
      background: `${M.warning}14`,
      border: `${M.warning}40`,
    };
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          background: M.white,
          borderRadius: 22,
          padding: 24,
          border: `1px solid ${M.border}`,
          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ShieldAlert color={M.teal} />
            <div>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p style={{ margin: "4px 0 0", color: M.textSec, fontSize: 12 }}>{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => void loadData()}
            style={{
              border: `1px solid ${M.border}`,
              background: "transparent",
              padding: "8px 14px",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: M.textSec }}>
            <Loader2 className="spin" size={16} />
            Loading...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ padding: 20, borderRadius: 15, border: `1px dashed ${M.border}`, display: "flex", gap: 10 }}>
            <MailCheck />
            No requests.
          </div>
        )}

        {error && <p style={{ marginTop: 10, color: M.danger, fontSize: 13 }}>{error}</p>}

        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {items.map((item) => {
            const busy = busyId === item.id;
            const status = statusStyle(item.status);
            const isPending = item.status === "Pending";

            return (
              <div
                key={item.id}
                style={{
                  background: M.bgTeal,
                  borderRadius: 18,
                  padding: 18,
                  border: `1px solid ${M.border}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>{item.email}</p>
                    <p style={{ fontSize: 13, color: M.textSec, margin: "4px 0 0" }}>Requested role: {item.requestedRole}</p>
                  </div>

                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background: status.background,
                      color: status.color,
                      border: `1px solid ${status.border}`,
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                {isPending && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 15 }}>
                    <button
                      disabled={busy}
                      onClick={() => void handleApprove(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: M.teal,
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: "9px 15px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {busy ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                      Approve
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => void handleReject(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        color: M.danger,
                        border: `1px solid ${M.danger}`,
                        borderRadius: 12,
                        padding: "9px 15px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
