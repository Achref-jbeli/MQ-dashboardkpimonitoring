import { useEffect, useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Activity,
  Layers,
  FolderKanban,
  Search,
  X,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { M } from "../../theme/tokens";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import {
  uploadKpiFile,
  uploadJiraKpis,
  getKpiRecords,
  createKpiRecord,
  updateKpiRecord,
  deleteKpiRecord,
  type KpiRecord,
  type KpiRecordInput,
  type KpiImportResult,
} from "../../api/kpiApi";
import { getProjects } from "../../api/projectApi";
import { getBusinessUnits, type BusinessUnit } from "../../api/businessUnitApi";
import type { Project } from "../../types/project";
import { AdherenceToScheduleChart } from "../charts/AdherenceToScheduleChart";
import { getActiveDepartmentId } from "../../utils/departmentScope";

// Every editable column of the Kpi database table, rendered generically in the add/edit form.
type FieldType = "text" | "number" | "date" | "boolean" | "textarea" | "select";
interface FieldDef {
  key: keyof KpiRecordInput;
  label: string;
  type: FieldType;
}

const RECORD_FIELDS: FieldDef[] = [
  { key: "designation", label: "Designation", type: "text" },
  { key: "sourceType", label: "Source Type", type: "text" },
  { key: "sourceIdentifier", label: "Source Identifier", type: "text" },
  { key: "calculatedValue", label: "Calculated Value", type: "number" },
  { key: "formula", label: "Formula", type: "text" },
  { key: "sheetNumber", label: "Sheet Number (N° FicheM.)", type: "text" },
  { key: "modificationReason", label: "Modification Reason", type: "text" },
  { key: "businessUnit", label: "Business Unit", type: "select" },
  { key: "mecType", label: "MEC Type", type: "text" },
  { key: "descriptionInZloAev", label: "Description in ZLO_AEV", type: "text" },
  { key: "division", label: "Division", type: "text" },
  { key: "otpElement", label: "OTP Element", type: "text" },
  { key: "responsible", label: "Responsible", type: "text" },
  { key: "responsibleDepartment", label: "Responsible Department", type: "text" },
  { key: "createdBy", label: "Created By", type: "text" },
  { key: "createdOn", label: "Created On", type: "date" },
  { key: "workItem", label: "Work Item", type: "text" },
  { key: "tasks", label: "Tasks", type: "text" },
  { key: "user", label: "User", type: "text" },
  { key: "function", label: "Function", type: "text" },
  { key: "sendDate", label: "Send Date", type: "date" },
  { key: "endDate", label: "End Date", type: "date" },
  { key: "done", label: "Done", type: "boolean" },
  { key: "doneDate", label: "Done Date", type: "date" },
  { key: "initialDate", label: "Initial Date", type: "date" },
  { key: "note", label: "Note", type: "textarea" },
  { key: "days", label: "Days", type: "number" },
  { key: "sendEndDate", label: "Send-End Date", type: "number" },
  { key: "notReceivedInTime", label: "Not Received In Time", type: "boolean" },
  { key: "backlog", label: "Backlog", type: "boolean" },
  { key: "delay", label: "Delay", type: "number" },
  { key: "leadTime", label: "Lead Time", type: "number" },
  { key: "month", label: "Month", type: "text" },
  { key: "initialDateUpdated", label: "Initial Date Updated", type: "date" },
  { key: "adherenceToSchedule", label: "Adherence To Schedule", type: "number" },
  { key: "green", label: "Green", type: "boolean" },
  { key: "yellow", label: "Yellow", type: "boolean" },
  { key: "orange", label: "Orange", type: "boolean" },
  { key: "red", label: "Red", type: "boolean" },
];

const EMPTY_RECORD_FORM: Record<string, any> = {
  sourceType: "Manual",
  green: false,
  yellow: false,
  orange: false,
  red: false,
};

// Every column of the Kpi table, rendered in the records table (in addition to Project/Actions).
const TABLE_COLUMNS: { key: keyof KpiRecord; label: string }[] = [
  { key: "designation", label: "Designation" },
  { key: "businessUnit", label: "Business Unit" },
  { key: "calculatedValue", label: "Calculated Value" },
  { key: "adherenceToSchedule", label: "Adherence" },
  { key: "sourceType", label: "Source" },
  { key: "sourceIdentifier", label: "Source Identifier" },
  { key: "month", label: "Month" },
  { key: "formula", label: "Formula" },
  { key: "sheetNumber", label: "Sheet Number" },
  { key: "modificationReason", label: "Modification Reason" },
  { key: "mecType", label: "MEC Type" },
  { key: "descriptionInZloAev", label: "Description ZLO_AEV" },
  { key: "division", label: "Division" },
  { key: "otpElement", label: "OTP Element" },
  { key: "responsible", label: "Responsible" },
  { key: "responsibleDepartment", label: "Responsible Dept" },
  { key: "createdBy", label: "Created By" },
  { key: "createdOn", label: "Created On" },
  { key: "workItem", label: "Work Item" },
  { key: "tasks", label: "Tasks" },
  { key: "user", label: "User" },
  { key: "function", label: "Function" },
  { key: "sendDate", label: "Send Date" },
  { key: "endDate", label: "End Date" },
  { key: "done", label: "Done" },
  { key: "doneDate", label: "Done Date" },
  { key: "initialDate", label: "Initial Date" },
  { key: "note", label: "Note" },
  { key: "days", label: "Days" },
  { key: "sendEndDate", label: "Send-End" },
  { key: "notReceivedInTime", label: "Not Received In Time" },
  { key: "backlog", label: "Backlog" },
  { key: "delay", label: "Delay" },
  { key: "leadTime", label: "Lead Time" },
  { key: "initialDateUpdated", label: "Initial Date Updated" },
  { key: "calculatedAtUtc", label: "Calculated At" },
];

function formatCellValue(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.split("T")[0];
  }
  return String(value);
}

export function KpiManagementView({ userRole }: { userRole?: string }) {
  const activeDepartmentId = getActiveDepartmentId();
  const [kpis, setKpis] = useState<KpiRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual add/edit/delete
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KpiRecord | null>(null);
  const [recordForm, setRecordForm] = useState<Record<string, any>>(EMPTY_RECORD_FORM);
  const [recordProjectId, setRecordProjectId] = useState<number | "">("");
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [buFilter, setBuFilter] = useState<string>("ALL");
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"project" | "performance">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [performanceUnit, setPerformanceUnit] = useState("");
  const [businessUnit, setBusinessUnit] = useState("HMI");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Jira Tab
  const [activeTab, setActiveTab] = useState<"file" | "jira">("file");
  const [jiraProjectId, setJiraProjectId] = useState<number | "">("");
  const [jiraExtractionApiId, setJiraExtractionApiId] = useState<number | "">("");
  const [jiraJql, setJiraJql] = useState("");

  // Result modal
  const [importResult, setImportResult] = useState<KpiImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiList, projectList, buList] = await Promise.all([
        getKpiRecords(),
        getProjects(),
        getBusinessUnits(),
      ]);
      setKpis(kpiList);
      setProjects(projectList);
      setBusinessUnits(buList);
      if (buList.length > 0) {
        setBusinessUnit((current) => (buList.some((bu) => bu.name === current) ? current : buList[0].name));
      }
    } catch (err: any) {
      console.error("Failed to load KPI data:", err);
      setError(err?.response?.data?.message || "Failed to load KPIs. Please check permissions or select a department.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingRecord(null);
    setRecordForm({ ...EMPTY_RECORD_FORM });
    setRecordProjectId("");
    setRecordError(null);
    setShowRecordModal(true);
  };

  const openEditModal = (kpi: KpiRecord) => {
    setEditingRecord(kpi);
    setRecordForm({ ...kpi });
    setRecordProjectId(kpi.projectId ?? "");
    setRecordError(null);
    setShowRecordModal(true);
  };

  const setFieldValue = (key: string, value: any) => {
    setRecordForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRecord = async () => {
    if (!recordForm.designation?.trim()) {
      setRecordError("Designation is required.");
      return;
    }

    setSavingRecord(true);
    setRecordError(null);
    try {
      const payload: Partial<KpiRecordInput> = {
        ...recordForm,
        projectId: recordProjectId === "" ? null : Number(recordProjectId),
      };

      if (editingRecord) {
        await updateKpiRecord(editingRecord.id, payload);
      } else {
        await createKpiRecord(payload);
      }

      setShowRecordModal(false);
      await loadData();
    } catch (err: any) {
      console.error("Failed to save KPI:", err);
      setRecordError(err?.response?.data?.message || "Failed to save KPI record.");
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (kpi: KpiRecord) => {
    if (!confirm(`Delete KPI "${kpi.designation ?? kpi.id}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteKpiRecord(kpi.id);
      await loadData();
    } catch (err: any) {
      console.error("Failed to delete KPI:", err);
      alert(err?.response?.data?.message || "Failed to delete KPI record.");
    }
  };

  // Stats calculation
  const totalKpis = kpis.length;
  const greenKpis = kpis.filter((k) => k.green).length;
  const yellowKpis = kpis.filter((k) => k.yellow || k.orange).length;
  const redKpis = kpis.filter((k) => k.red).length;
  const avgScore =
    totalKpis > 0
      ? (
          kpis.reduce((sum, k) => sum + (k.calculatedValue ?? k.adherenceToSchedule ?? 0), 0) /
          totalKpis
        ).toFixed(1)
      : "0";

  // Filtered KPIs
  const filteredKpis = kpis.filter((kpi) => {
    const matchesSearch =
      searchQuery === "" ||
      (kpi.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (kpi.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (kpi.businessUnit?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesBU =
      buFilter === "ALL" ||
      (kpi.businessUnit?.toUpperCase() === buFilter.toUpperCase());

    const matchesScope =
      scopeFilter === "ALL" ||
      (scopeFilter === "PROJECT" && kpi.projectId != null) ||
      (scopeFilter === "PERFORMANCE" && kpi.projectId == null);

    return matchesSearch && matchesBU && matchesScope;
  });

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExtensions = [".xlsx", ".xlsm", ".csv"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (validExtensions.includes(ext)) {
        setSelectedFile(file);
        setUploadError(null);
      } else {
        setUploadError("Only Excel (.xlsx, .xlsm) or CSV (.csv) files are supported.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (activeTab === "file") {
      if (!selectedFile) {
        setUploadError("Please select an Excel or CSV file to upload.");
        return;
      }

      if (uploadMode === "project" && selectedProjectId === "") {
        setUploadError("Please select a target Project for project-scoped KPIs.");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        if (uploadMode === "project") {
          formData.append("projectId", String(selectedProjectId));
        } else {
          if (performanceUnit.trim()) {
            formData.append("performanceUnit", performanceUnit.trim());
          }
          if (businessUnit) {
            formData.append("businessUnit", businessUnit);
          }
        }

        const result = await uploadKpiFile(formData, activeDepartmentId ?? undefined);
        setImportResult(result);
        setShowUploadModal(false);
        setSelectedFile(null);
        await loadData();
      } catch (err: any) {
        console.error("Upload error:", err);
        const data = err?.response?.data;
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const detailMsg = data.errors.map((e: any) => `• Row ${e.row ?? '?'}${e.column ? ` (${e.column})` : ''}: ${e.message}`).slice(0, 5).join('\n');
          setUploadError(`${data.title || "Validation Error"}: ${data.detail || ""}\n${detailMsg}`);
        } else {
          setUploadError(data?.detail || data?.message || data?.title || "Failed to process KPI file.");
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      // Jira Tab
      if (jiraProjectId === "") {
        setUploadError("Please select a project for Jira synchronization.");
        return;
      }
      if (jiraExtractionApiId === "") {
        setUploadError("Please specify the Extraction API ID.");
        return;
      }

      setIsUploading(true);
      try {
        const result = await uploadJiraKpis({
          projectId: Number(jiraProjectId),
          extractionApiId: Number(jiraExtractionApiId),
          jiraJql: jiraJql.trim() || undefined,
          departmentId: activeDepartmentId ?? undefined,
        });
        setImportResult(result);
        setShowUploadModal(false);
        await loadData();
      } catch (err: any) {
        console.error("Jira sync error:", err);
        const data = err?.response?.data;
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const detailMsg = data.errors.map((e: any) => `• ${e.message}`).slice(0, 5).join('\n');
          setUploadError(`${data.title || "Jira Import Error"}: ${data.detail || ""}\n${detailMsg}`);
        } else {
          setUploadError(data?.detail || data?.message || data?.title || "Failed to synchronize Jira issues.");
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: M.pageTitle,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              letterSpacing: "-0.01em",
            }}
          >
            <Activity style={{ color: M.teal }} size={28} />
            KPI Monitoring & Data Pipeline
          </h1>
          <p style={{ color: M.pageSubtitle, margin: "4px 0 0", fontSize: 14 }}>
            Unified processing for Excel/CSV imports, Jira extraction, and Task Performance metrics
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={loadData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              background: "var(--card, #FFFFFF)",
              border: `1px solid ${M.border}`,
              borderRadius: 10,
              color: M.textPrimary,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
              boxShadow: "var(--shadow, 0 2px 8px rgba(0,0,0,0.04))",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover, #F0F8F8)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card, #FFFFFF)")}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} style={{ color: M.teal }} />
            Refresh
          </button>

          <Button
            onClick={() => {
              setUploadError(null);
              setShowUploadModal(true);
            }}
            variant="primary"
          >
            <UploadCloud size={17} style={{ marginRight: 8 }} />
            Import KPI Data
          </Button>

          <Button onClick={openCreateModal} variant="primary">
            <Plus size={17} style={{ marginRight: 8 }} />
            Add KPI
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards (Consistent Layout Hierarchy) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >
        {/* Total KPIs */}
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: M.textSec, fontSize: 13, margin: 0, fontWeight: 600 }}>
                Total KPIs Scoped
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 0", color: M.textPrimary, fontFamily: "DM Mono, monospace" }}>
                {totalKpis}
              </h2>
            </div>
            <div
              style={{
                background: "rgba(0, 142, 149, 0.12)",
                padding: 10,
                borderRadius: 12,
                color: M.teal,
              }}
            >
              <Layers size={20} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: M.textMuted, margin: "10px 0 0" }}>
            Active across department & projects
          </p>
        </Card>

        {/* On Target (Green) */}
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: M.textSec, fontSize: 13, margin: 0, fontWeight: 600 }}>
                On Target (Green)
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 0", color: M.success, fontFamily: "DM Mono, monospace" }}>
                {greenKpis}
              </h2>
            </div>
            <div
              style={{
                background: M.successBg,
                padding: 10,
                borderRadius: 12,
                color: M.success,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: M.textMuted, margin: "10px 0 0" }}>
            Achievement score &ge; 80%
          </p>
        </Card>

        {/* Attention / Risk (Yellow) */}
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: M.textSec, fontSize: 13, margin: 0, fontWeight: 600 }}>
                Attention / Risk
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 0", color: M.warning, fontFamily: "DM Mono, monospace" }}>
                {yellowKpis}
              </h2>
            </div>
            <div
              style={{
                background: M.warningBg,
                padding: 10,
                borderRadius: 12,
                color: M.warning,
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: M.textMuted, margin: "10px 0 0" }}>
            Score between 40% and 79%
          </p>
        </Card>

        {/* Critical (Red) */}
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: M.textSec, fontSize: 13, margin: 0, fontWeight: 600 }}>
                Critical (Red)
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 0", color: M.danger, fontFamily: "DM Mono, monospace" }}>
                {redKpis}
              </h2>
            </div>
            <div
              style={{
                background: M.dangerBg,
                padding: 10,
                borderRadius: 12,
                color: M.danger,
              }}
            >
              <XCircle size={20} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: M.textMuted, margin: "10px 0 0" }}>
            Score below 40%
          </p>
        </Card>

        {/* Average Adherence */}
        <Card style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: M.textSec, fontSize: 13, margin: 0, fontWeight: 600 }}>
                Average Adherence
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 0", color: M.teal, fontFamily: "DM Mono, monospace" }}>
                {avgScore}%
              </h2>
            </div>
            <div
              style={{
                background: "rgba(0, 142, 149, 0.12)",
                padding: 10,
                borderRadius: 12,
                color: M.teal,
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: M.textMuted, margin: "10px 0 0" }}>
            Overall schedule adherence
          </p>
        </Card>
      </div>

      {/* Monthly Adherence to Schedule Chart */}
      <AdherenceToScheduleChart />

      {/* Filter and Search Bar */}
      <Card style={{ padding: "16px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--input-background, #EEF4F7)",
              border: `1px solid ${M.border}`,
              borderRadius: 10,
              padding: "8px 14px",
              minWidth: 260,
              flex: 1,
              maxWidth: 420,
            }}
          >
            <Search size={16} style={{ color: M.textSec, marginRight: 10 }} />
            <input
              type="text"
              placeholder="Search by KPI designation, project, or BU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: M.textPrimary,
                fontSize: 13,
                width: "100%",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "transparent", border: "none", color: M.textSec, cursor: "pointer", padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {/* Scope Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: M.textSec, fontWeight: 600 }}>Scope:</span>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                style={{
                  background: "var(--input-background, #EEF4F7)",
                  color: M.textPrimary,
                  border: `1px solid ${M.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Scopes</option>
                <option value="PROJECT">Project-Related KPIs</option>
                <option value="PERFORMANCE">Task Performance</option>
              </select>
            </div>

            {/* Business Unit Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: M.textSec, fontWeight: 600 }}>BU:</span>
              <select
                value={buFilter}
                onChange={(e) => setBuFilter(e.target.value)}
                style={{
                  background: "var(--input-background, #EEF4F7)",
                  color: M.textPrimary,
                  border: `1px solid ${M.border}`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All BUs</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.name}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Records Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: M.textSec }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: M.teal }} />
            <p style={{ color: M.textPrimary, fontSize: 14, fontWeight: 600 }}>Loading KPI data...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 36, textAlign: "center", color: M.danger }}>
            <AlertTriangle size={32} style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>{error}</p>
          </div>
        ) : filteredKpis.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: M.textSec }}>
            <Layers size={44} style={{ margin: "0 auto 14px", opacity: 0.6, color: M.teal }} />
            <h3 style={{ margin: 0, color: M.textPrimary, fontSize: 18, fontWeight: 700 }}>No KPIs Found</h3>
            <p style={{ margin: "6px 0 18px", fontSize: 13, color: M.textSec }}>
              {kpis.length === 0
                ? "No KPI records have been uploaded for this department yet."
                : "No KPI matches your current search filters."}
            </p>
            <Button onClick={() => setShowUploadModal(true)} variant="primary">
              <UploadCloud size={16} style={{ marginRight: 6 }} />
              Upload First KPI File
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${M.border}`, color: M.textSec, background: "var(--table-header-bg, #F8FAFC)" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 700, position: "sticky", left: 0, background: "inherit" }}>Actions</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Scope / Project</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status</th>
                  {TABLE_COLUMNS.map((col) => (
                    <th key={col.key} style={{ padding: "14px 18px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredKpis.map((kpi) => {
                  const isGreen = kpi.green;
                  const isYellow = kpi.yellow || kpi.orange;
                  const statusBg = isGreen ? M.successBg : isYellow ? M.warningBg : M.dangerBg;
                  const statusColor = isGreen ? M.successText : isYellow ? M.warningText : M.dangerText;
                  const statusDot = isGreen ? M.success : isYellow ? M.warning : M.danger;
                  const statusLabel = isGreen ? "Green" : isYellow ? "Yellow" : "Red";

                  return (
                    <tr
                      key={kpi.id}
                      style={{
                        borderBottom: `1px solid ${M.borderSubtle}`,
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--table-row-hover, #F1F7F7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 18px", position: "sticky", left: 0, background: "inherit" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEditModal(kpi)}
                            title="Edit"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              border: `1px solid ${M.border}`,
                              background: M.white,
                              color: M.teal,
                              cursor: "pointer",
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(kpi)}
                            title="Delete"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              border: `1px solid ${M.border}`,
                              background: M.white,
                              color: M.danger,
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        {kpi.projectId ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 8,
                              background: "rgba(0, 142, 149, 0.12)",
                              color: M.teal,
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <FolderKanban size={13} />
                            {kpi.projectTitle || `Project #${kpi.projectId}`}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 8,
                              background: "rgba(139, 92, 246, 0.14)",
                              color: "#8B5CF6",
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Activity size={13} />
                            Task Performance
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 12,
                            background: statusBg,
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: statusDot,
                            }}
                          />
                          {statusLabel}
                        </span>
                      </td>

                      {TABLE_COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "14px 18px",
                            color: M.textSec,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={formatCellValue(kpi[col.key])}
                        >
                          {formatCellValue(kpi[col.key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* Upload Modal (Themed Modal with Accessible Contrast)                     */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--card, #FFFFFF)",
              border: `1px solid ${M.border}`,
              borderRadius: 20,
              width: "100%",
              maxWidth: 580,
              overflow: "hidden",
              boxShadow: "var(--shadow-md, 0 20px 40px rgba(0,0,0,0.15))",
              color: M.textPrimary,
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: `1px solid ${M.border}`,
                background: "var(--surface-secondary, #EEF4F7)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    background: "rgba(0, 142, 149, 0.12)",
                    padding: 8,
                    borderRadius: 10,
                    color: M.teal,
                  }}
                >
                  <UploadCloud size={20} />
                </div>
                <h3 style={{ margin: 0, color: M.textPrimary, fontSize: 18, fontWeight: 800 }}>
                  Import & Calculate KPI Data
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: M.textSec,
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = M.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = M.textSec)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div
              style={{
                display: "flex",
                borderBottom: `1px solid ${M.border}`,
                background: "var(--surface-secondary, #EEF4F7)",
              }}
            >
              <button
                onClick={() => setActiveTab("file")}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: activeTab === "file" ? "var(--card, #FFFFFF)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === "file" ? `3px solid ${M.teal}` : "none",
                  color: activeTab === "file" ? M.teal : M.textSec,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Excel / CSV Spreadsheet
              </button>
              <button
                onClick={() => setActiveTab("jira")}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  background: activeTab === "jira" ? "var(--card, #FFFFFF)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === "jira" ? `3px solid ${M.teal}` : "none",
                  color: activeTab === "jira" ? M.teal : M.textSec,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Jira Cloud Integration
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ padding: 24 }}>
              {uploadError && (
                <div
                  style={{
                    background: M.dangerBg,
                    border: `1px solid ${M.danger}`,
                    color: M.dangerText,
                    padding: "12px 16px",
                    borderRadius: 10,
                    marginBottom: 20,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={18} style={{ color: M.danger, flexShrink: 0 }} />
                  <span>{uploadError}</span>
                </div>
              )}

              {activeTab === "file" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Mode Switcher: Project vs Performance */}
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: M.textSec,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 10,
                      }}
                    >
                      Target Pipeline Scope
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div
                        onClick={() => setUploadMode("project")}
                        style={{
                          padding: "14px",
                          borderRadius: 12,
                          border: `2px solid ${uploadMode === "project" ? M.teal : M.border}`,
                          background: uploadMode === "project" ? "rgba(0, 142, 149, 0.10)" : "var(--surface-secondary, #EEF4F7)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 700,
                            fontSize: 14,
                            color: uploadMode === "project" ? M.teal : M.textPrimary,
                          }}
                        >
                          <FolderKanban size={18} />
                          Project-Related
                        </div>
                        <p style={{ fontSize: 12, color: M.textSec, margin: "6px 0 0", lineHeight: 1.4 }}>
                          Link KPIs directly to a specific project (HMI / HIS)
                        </p>
                      </div>

                      <div
                        onClick={() => setUploadMode("performance")}
                        style={{
                          padding: "14px",
                          borderRadius: 12,
                          border: `2px solid ${uploadMode === "performance" ? M.teal : M.border}`,
                          background: uploadMode === "performance" ? "rgba(0, 142, 149, 0.10)" : "var(--surface-secondary, #EEF4F7)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 700,
                            fontSize: 14,
                            color: uploadMode === "performance" ? M.teal : M.textPrimary,
                          }}
                        >
                          <Activity size={18} />
                          Task Performance
                        </div>
                        <p style={{ fontSize: 12, color: M.textSec, margin: "6px 0 0", lineHeight: 1.4 }}>
                          Employee tasks or general department performance metrics
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Project Selector (if mode is project) */}
                  {uploadMode === "project" ? (
                    <div>
                      <label
                        style={{
                          fontSize: 13,
                          color: M.textSec,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Select Target Project <span style={{ color: M.danger }}>*</span>
                      </label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) =>
                          setSelectedProjectId(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          borderRadius: 10,
                          background: "var(--input-background, #EEF4F7)",
                          border: `1px solid ${M.border}`,
                          color: M.textPrimary,
                          fontSize: 14,
                          fontWeight: 600,
                          outline: "none",
                        }}
                      >
                        <option value="">-- Choose a Project --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.businessUnit?.name || "General"})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label
                          style={{
                            fontSize: 13,
                            color: M.textSec,
                            fontWeight: 700,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Performance Unit Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. PM, Development, QA"
                          value={performanceUnit}
                          onChange={(e) => setPerformanceUnit(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            borderRadius: 10,
                            background: "var(--input-background, #EEF4F7)",
                            border: `1px solid ${M.border}`,
                            color: M.textPrimary,
                            fontSize: 14,
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: 13,
                            color: M.textSec,
                            fontWeight: 700,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Business Unit Scope
                        </label>
                        <select
                          value={businessUnit}
                          onChange={(e) => setBusinessUnit(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            borderRadius: 10,
                            background: "var(--input-background, #EEF4F7)",
                            border: `1px solid ${M.border}`,
                            color: M.textPrimary,
                            fontSize: 14,
                            fontWeight: 600,
                            outline: "none",
                          }}
                        >
                          {businessUnits.map((bu) => (
                            <option key={bu.id} value={bu.name}>
                              {bu.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Drag & Drop File Zone */}
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: M.textSec,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Spreadsheet File (.xlsx, .xlsm, .csv) <span style={{ color: M.danger }}>*</span>
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${selectedFile ? M.success : M.borderDark}`,
                        borderRadius: 14,
                        padding: "28px 20px",
                        textAlign: "center",
                        background: selectedFile ? M.successBg : "var(--surface-secondary, #EEF4F7)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedFile) e.currentTarget.style.borderColor = M.teal;
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedFile) e.currentTarget.style.borderColor = M.borderDark;
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xlsm,.csv"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />

                      {selectedFile ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              background: "rgba(22, 163, 74, 0.2)",
                              padding: 12,
                              borderRadius: "50%",
                              color: M.success,
                            }}
                          >
                            <FileSpreadsheet size={32} />
                          </div>
                          <p style={{ margin: 0, fontWeight: 700, color: M.textPrimary, fontSize: 15 }}>
                            {selectedFile.name}
                          </p>
                          <span style={{ fontSize: 12, color: M.textSec }}>
                            {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose another file
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              background: "rgba(0, 142, 149, 0.12)",
                              padding: 12,
                              borderRadius: "50%",
                              color: M.teal,
                            }}
                          >
                            <UploadCloud size={32} />
                          </div>
                          <p style={{ margin: 0, fontWeight: 700, color: M.textPrimary, fontSize: 15 }}>
                            Click to upload or drag & drop file
                          </p>
                          <span style={{ fontSize: 12, color: M.textSec }}>
                            Supports French Excel formulas (SI, ET, OU, MOIS, NB.JOURS.OUVRES)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: M.textSec,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Target Project <span style={{ color: M.danger }}>*</span>
                    </label>
                    <select
                      value={jiraProjectId}
                      onChange={(e) =>
                        setJiraProjectId(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 10,
                        background: "var(--input-background, #EEF4F7)",
                        border: `1px solid ${M.border}`,
                        color: M.textPrimary,
                        fontSize: 14,
                        fontWeight: 600,
                        outline: "none",
                      }}
                    >
                      <option value="">-- Choose a Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.businessUnit?.name || "General"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: M.textSec,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Extraction API ID <span style={{ color: M.danger }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1"
                      value={jiraExtractionApiId}
                      onChange={(e) =>
                        setJiraExtractionApiId(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 10,
                        background: "var(--input-background, #EEF4F7)",
                        border: `1px solid ${M.border}`,
                        color: M.textPrimary,
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        color: M.textSec,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Optional JQL Query Filter
                    </label>
                    <input
                      type="text"
                      placeholder="project = PROJ AND status != Done"
                      value={jiraJql}
                      onChange={(e) => setJiraJql(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 10,
                        background: "var(--input-background, #EEF4F7)",
                        border: `1px solid ${M.border}`,
                        color: M.textPrimary,
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 26,
                  borderTop: `1px solid ${M.border}`,
                  paddingTop: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "var(--surface-secondary, #EEF4F7)",
                    border: `1px solid ${M.border}`,
                    color: M.textSec,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = M.textPrimary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = M.textSec)}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  variant="primary"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Processing Pipeline...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Run Import & Calculation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit KPI Record Modal */}
      {showRecordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--card, #FFFFFF)",
              border: `1px solid ${M.border}`,
              borderRadius: 20,
              width: "100%",
              maxWidth: 760,
              maxHeight: "88vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "var(--shadow-md, 0 20px 40px rgba(0,0,0,0.15))",
              color: M.textPrimary,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                {editingRecord ? "Edit KPI" : "Add KPI"}
              </h3>
              <button
                onClick={() => setShowRecordModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: M.textSec }}
              >
                <X size={20} />
              </button>
            </div>

            {recordError && (
              <p style={{ fontSize: 13, color: M.danger, marginBottom: 14, whiteSpace: "pre-line" }}>{recordError}</p>
            )}

            <div>
              <label style={{ fontSize: 13, color: M.textSec, fontWeight: 700, display: "block", marginBottom: 8 }}>
                Project (optional — leave blank for Task Performance KPI)
              </label>
              <select
                value={recordProjectId}
                onChange={(e) => setRecordProjectId(e.target.value === "" ? "" : Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "var(--input-background, #EEF4F7)",
                  border: `1px solid ${M.border}`,
                  color: M.textPrimary,
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                <option value="">-- No Project (Task Performance) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {RECORD_FIELDS.map((field) => {
                const value = recordForm[field.key] ?? "";

                if (field.type === "boolean") {
                  return (
                    <label
                      key={field.key}
                      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: M.textPrimary, fontWeight: 600 }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(recordForm[field.key])}
                        onChange={(e) => setFieldValue(field.key, e.target.checked)}
                      />
                      {field.label}
                    </label>
                  );
                }

                return (
                  <div key={field.key} style={{ gridColumn: field.type === "textarea" ? "1 / -1" : undefined }}>
                    <label style={{ fontSize: 12, color: M.textSec, fontWeight: 700, display: "block", marginBottom: 6 }}>
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={value}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "var(--input-background, #EEF4F7)",
                          border: `1px solid ${M.border}`,
                          color: M.textPrimary,
                          fontSize: 13,
                        }}
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={value}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "var(--input-background, #EEF4F7)",
                          border: `1px solid ${M.border}`,
                          color: M.textPrimary,
                          fontSize: 13,
                        }}
                      >
                        <option value="">-- Select --</option>
                        {businessUnits.map((bu) => (
                          <option key={bu.id} value={bu.name}>
                            {bu.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={value}
                        onChange={(e) =>
                          setFieldValue(
                            field.key,
                            field.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "var(--input-background, #EEF4F7)",
                          border: `1px solid ${M.border}`,
                          color: M.textPrimary,
                          fontSize: 13,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <Button onClick={() => setShowRecordModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleSaveRecord} variant="primary" disabled={savingRecord}>
                {savingRecord ? "Saving..." : editingRecord ? "Save Changes" : "Create KPI"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Notification Modal */}
      {importResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--card, #FFFFFF)",
              border: `1px solid ${M.border}`,
              borderRadius: 20,
              width: "100%",
              maxWidth: 540,
              padding: 28,
              boxShadow: "var(--shadow-md, 0 20px 40px rgba(0,0,0,0.15))",
              color: M.textPrimary,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  background: M.successBg,
                  padding: 12,
                  borderRadius: "50%",
                  color: M.success,
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: M.textPrimary, fontSize: 20, fontWeight: 800 }}>
                  KPI Import Successful
                </h3>
                <p style={{ margin: "3px 0 0", color: M.textSec, fontSize: 13 }}>
                  Imported {importResult.importedCount} new, updated {importResult.updatedCount} KPIs
                </p>
              </div>
            </div>

            {/* Calculated Metrics Grid */}
            {importResult.calculatedMetrics && Object.keys(importResult.calculatedMetrics).length > 0 && (
              <div style={{ margin: "18px 0" }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: M.textSec,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Pipeline Calculated Metrics
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    background: "var(--surface-secondary, #EEF4F7)",
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${M.border}`,
                  }}
                >
                  {Object.entries(importResult.calculatedMetrics).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        padding: "4px 0",
                        borderBottom: `1px solid ${M.borderSubtle}`,
                      }}
                    >
                      <span style={{ color: M.textSec }}>{key}:</span>
                      <span style={{ fontWeight: 700, color: M.teal, fontFamily: "DM Mono, monospace" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <Button
                onClick={() => setImportResult(null)}
                variant="primary"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
