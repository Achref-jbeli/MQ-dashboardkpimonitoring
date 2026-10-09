import { useRef, useState } from "react";
import { M } from "../../theme/tokens";
import { AdherenceToScheduleChart } from "../../components/charts/AdherenceToScheduleChart";
import { uploadKpiFile } from "../../api/kpiApi";
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface DeptConfig {
  id: number;
  label: string;
  sourceDeptId: number;
  responsibleDepartments: string;
}

const DEPARTMENTS: DeptConfig[] = [
  { id: 6, label: "R&D",  sourceDeptId: 6, responsibleDepartments: "PM1-TU,RDM-TU,PM_I-TU,RDM_M-TU,RDE-TU,RDM_I-TU" },
  { id: 2, label: "RDM",  sourceDeptId: 6, responsibleDepartments: "RDM-TU,RDM_M-TU,RDM_I-TU" },
  { id: 3, label: "RDE",  sourceDeptId: 6, responsibleDepartments: "RDE-TU" },
  { id: 5, label: "RDD",  sourceDeptId: 6, responsibleDepartments: "RDD-TU" },
];

interface UploadState {
  loading: boolean;
  result: { importedCount: number; updatedCount: number; totalRows?: number; failedCount?: number; errors?: { row?: number; message: string }[] } | null;
  error: string | null;
  chartKey: number;
}

function DeptAdherenceSection({ dept }: { dept: DeptConfig }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ loading: false, result: null, error: null, chartKey: 0 });

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setState((s) => ({ ...s, loading: true, result: null, error: null }));
    const fd = new FormData();
    fd.append("file", files[0]);
    try {
      const result = await uploadKpiFile(fd, dept.id);
      setState((s) => ({ loading: false, result, error: null, chartKey: s.chartKey + 1 }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.response?.data?.message ?? "Upload failed." }));
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      style={{
        background: "var(--card,#fff)",
        borderRadius: 18,
        border: `1px solid ${M.border}`,
        boxShadow: "0 2px 14px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          borderBottom: `1px solid ${M.border}`,
          background: "var(--surface-secondary,#EEF4F7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(0,142,149,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, color: M.teal,
            }}
          >
            {dept.label}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: M.textPrimary }}>
              {dept.label} — Adherence
            </p>
            <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>
              Upload an Excel file to populate monthly traffic-light data
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {state.result && (
            <span style={{ fontSize: 12, color: state.result.importedCount === 0 && state.result.updatedCount === 0 ? M.warning : M.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {state.result.importedCount === 0 && state.result.updatedCount === 0
                ? <><AlertTriangle size={13} /> 0 rows saved — check file format</>
                : <><CheckCircle2 size={13} /> {state.result.importedCount} new, {state.result.updatedCount} updated</>}
            </span>
          )}
          {state.error && (
            <span style={{ fontSize: 12, color: M.danger, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={13} /> {state.error}
            </span>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={state.loading}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 12, border: "none",
              background: M.teal, color: "#fff",
              fontSize: 12, fontWeight: 700,
              cursor: state.loading ? "wait" : "pointer",
              opacity: state.loading ? 0.75 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {state.loading
              ? <><Loader2 size={13} className="animate-spin" /> Uploading…</>
              : <><UploadCloud size={13} /> Upload Excel</>}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files)}
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: "20px 22px" }}>
        <AdherenceToScheduleChart
          key={state.chartKey}
          departmentId={dept.id}
          sourceDeptId={dept.sourceDeptId}
          responsibleDepartments={dept.responsibleDepartments}
          title={`${dept.label} — Adherence`}
        />
      </div>
    </div>
  );
}

export function KpiManagementPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: M.textPrimary }}>
          Adherence
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: M.textSec }}>
          Monthly traffic-light breakdown per R&D department — upload Excel data to populate each chart.
        </p>
      </div>

      {DEPARTMENTS.map((dept) => (
        <DeptAdherenceSection key={dept.id} dept={dept} />
      ))}
    </div>
  );
}
