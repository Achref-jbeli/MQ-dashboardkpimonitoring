import { useEffect, useState } from "react";
import "../../styles/TeamPage.css";
import {
    getTeams,
    getAvailableEmployees,
    getTeamLeaders,
    createTeam,
    updateTeam,
    deleteTeam,
    assignMembers
} from "../../api/TeamApi";
import { getDepartments } from "../../api/departmentApi";
import type { Department } from "../../types/department";
import type {
    TeamDto,
    Employee,
    TeamLeaderOption
} from "../../types/TeamDto";
import { isSuperAdminRole } from "../../utils/departmentScope";

export function TeamsPage() {
    const role = localStorage.getItem("role");
    const isSuperAdmin = isSuperAdminRole(role);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);

    const [teams, setTeams] = useState<TeamDto[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaders, setLeaders] = useState<TeamLeaderOption[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [formDepartmentId, setFormDepartmentId] = useState<number>(0);
    const [teamLeaderId, setTeamLeaderId] = useState<number>(0);

    const [editingTeam, setEditingTeam] = useState<TeamDto | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<TeamDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingLeaders, setLoadingLeaders] = useState(false);

    // Initial load departments
    useEffect(() => {
        getDepartments()
            .then(depts => {
                setDepartments(depts || []);
                if (depts && depts.length > 0) {
                    setSelectedDepartmentId(depts[0].id);
                    setFormDepartmentId(depts[0].id);
                }
            })
            .catch(err => console.error("Error loading departments:", err));
    }, []);

    // Load teams for selected department
    async function loadTeams(deptId: number) {
        setLoading(true);
        try {
            const t = await getTeams(deptId > 0 ? deptId : undefined);
            setTeams(t || []);
        } catch (error) {
            console.error("Error loading teams:", error);
        } finally {
            setLoading(false);
        }
    }

    // Load leaders and available members for form department
    async function loadDepartmentMembersAndLeaders(deptId: number) {
        if (!deptId) {
            setLeaders([]);
            setEmployees([]);
            return;
        }
        setLoadingLeaders(true);
        try {
            const [l, e] = await Promise.all([
                getTeamLeaders(deptId),
                getAvailableEmployees(deptId)
            ]);
            setLeaders(l || []);
            setEmployees(e || []);
        } catch (error) {
            console.error("Error loading department leaders:", error);
            setLeaders([]);
            setEmployees([]);
        } finally {
            setLoadingLeaders(false);
        }
    }

    useEffect(() => {
        if (selectedDepartmentId) {
            loadTeams(selectedDepartmentId);
        }
    }, [selectedDepartmentId]);

    useEffect(() => {
        if (formDepartmentId) {
            loadDepartmentMembersAndLeaders(formDepartmentId);
            setTeamLeaderId(0);
        }
    }, [formDepartmentId]);

    async function handleSaveTeam() {
        if (!name.trim()) {
            alert("Please enter a team name.");
            return;
        }

        if (!formDepartmentId) {
            alert("Please select a department for the team.");
            return;
        }

        if (!teamLeaderId) {
            alert("Please select an eligible team leader.");
            return;
        }

        try {
            if (editingTeam) {
                await updateTeam(editingTeam.id, {
                    name,
                    description,
                    departmentId: formDepartmentId,
                    teamLeaderId
                }, formDepartmentId);

                if (selectedEmployees.length > 0) {
                    await assignMembers(editingTeam.id, selectedEmployees, formDepartmentId);
                }
                alert("Team updated successfully!");
                setEditingTeam(null);
            } else {
                const team = await createTeam({
                    name,
                    description,
                    departmentId: formDepartmentId,
                    teamLeaderId
                }, formDepartmentId);

                if (selectedEmployees.length > 0 && team?.id) {
                    await assignMembers(team.id, selectedEmployees, formDepartmentId);
                }
                alert("Team created successfully!");
            }

            setName("");
            setDescription("");
            setTeamLeaderId(0);
            setSelectedEmployees([]);
            loadTeams(selectedDepartmentId);
            loadDepartmentMembersAndLeaders(formDepartmentId);
        } catch (error: any) {
            console.error("Error saving team:", error);
            alert(error?.response?.data?.message || "Failed to save team. Please check inputs.");
        }
    }

    function handleStartEdit(team: TeamDto) {
        setEditingTeam(team);
        setName(team.name);
        setDescription(team.description || "");
        setFormDepartmentId(team.departmentId);
        setTeamLeaderId(team.teamLeaderId);
        setSelectedEmployees([]);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        setEditingTeam(null);
        setName("");
        setDescription("");
        setFormDepartmentId(selectedDepartmentId);
        setTeamLeaderId(0);
        setSelectedEmployees([]);
    }

    async function handleDeleteTeam(team: TeamDto) {
        if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return;
        try {
            await deleteTeam(team.id, team.departmentId);
            loadTeams(selectedDepartmentId);
            loadDepartmentMembersAndLeaders(formDepartmentId);
            if (selectedTeam?.id === team.id) setSelectedTeam(null);
        } catch (error: any) {
            console.error("Error deleting team:", error);
            alert(error?.response?.data?.message || "Failed to delete team.");
        }
    }

    function toggleEmployee(id: number) {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    return (
        <div className="teams-page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <h1 className="teams-title" style={{ margin: 0 }}>Teams Management</h1>
                
                {/* Department Filter Selector (SuperAdmin only) / Department Name (Administrator) */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Department:</label>
                    {isSuperAdmin ? (
                        <select
                            style={{
                                padding: "8px 14px",
                                borderRadius: 10,
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0f172a",
                                outline: "none"
                            }}
                            value={selectedDepartmentId}
                            onChange={e => setSelectedDepartmentId(Number(e.target.value))}
                        >
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                            {departments[0]?.name ?? "—"}
                        </span>
                    )}
                </div>
            </div>

            {/* Team Create / Edit Form Card */}
            <div className="team-create-card">
                <h2 className="section-title">
                    {editingTeam ? `Edit Team — ${editingTeam.name}` : "Create New Team"}
                </h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="form-group">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                            Team Name *
                        </label>
                        <input
                            className="team-input"
                            placeholder="e.g. Frontend Core Team"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                            Department *
                        </label>
                        {isSuperAdmin ? (
                            <select
                                className="team-input"
                                value={formDepartmentId}
                                onChange={e => {
                                    const newDeptId = Number(e.target.value);
                                    setFormDepartmentId(newDeptId);
                                }}
                            >
                                <option value={0}>Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="team-input"
                                value={departments[0]?.name ?? ""}
                                disabled
                                readOnly
                            />
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                        Team Description
                    </label>
                    <textarea
                        className="team-input"
                        placeholder="Brief overview of team responsibilities..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>

                {/* Team Leader Dropdown Driven by Department */}
                <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                        Team Leader * {loadingLeaders && "(Loading eligible leaders...)"}
                    </label>
                    <select
                        className="team-input"
                        value={teamLeaderId}
                        onChange={e => setTeamLeaderId(Number(e.target.value))}
                        disabled={loadingLeaders || !formDepartmentId}
                    >
                        <option value={0}>
                            {!formDepartmentId
                                ? "Select a department first"
                                : leaders.length === 0
                                ? "No eligible leaders found in this department"
                                : "Select Eligible Team Leader"}
                        </option>
                        {leaders.map(leader => (
                            <option key={leader.id} value={leader.id}>
                                {leader.firstName} {leader.lastName} {leader.position ? `(${leader.position})` : ""} {leader.isAssigned && leader.assignedTeamId !== editingTeam?.id ? `[Already leading: ${leader.assignedTeamName}]` : ""}
                            </option>
                        ))}
                    </select>
                    {formDepartmentId > 0 && leaders.length === 0 && !loadingLeaders && (
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#b45309" }}>
                            ⚠️ No active employees available in this department to act as team leader.
                        </p>
                    )}
                </div>

                {/* Member Selection */}
                <h3 className="section-title mt-4">Add Available Members</h3>
                <div className="employee-grid">
                    {employees.map(emp => {
                        const isSelected = selectedEmployees.includes(emp.id);
                        return (
                            <div
                                key={emp.id}
                                className={`employee-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleEmployee(emp.id)}
                            >
                                <div className="card-content">
                                    <div className="employee-avatar">
                                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                    </div>
                                    <div className="employee-details">
                                        <strong>{emp.firstName} {emp.lastName}</strong>
                                        <span className="domain-badge">{emp.position || emp.professionalDomain || 'Member'}</span>
                                    </div>
                                </div>
                                <div className={`selection-indicator ${isSelected ? 'active' : ''}`}>
                                    ✓
                                </div>
                            </div>
                        );
                    })}
                    {employees.length === 0 && (
                        <p className="no-data">No unassigned employees available in this department.</p>
                    )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button className="primary-btn" onClick={handleSaveTeam}>
                        {editingTeam ? "Save Changes" : "Create Team"}
                    </button>
                    {editingTeam && (
                        <button
                            style={{
                                padding: "10px 18px",
                                borderRadius: 10,
                                border: "1px solid #cbd5e1",
                                background: "#f8fafc",
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#475569",
                                cursor: "pointer"
                            }}
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Existing Teams Grid */}
            <h2 className="section-title">
                Existing Teams ({teams.length})
            </h2>
            
            {loading ? (
                <p className="no-data">Loading teams...</p>
            ) : teams.length === 0 ? (
                <p className="no-data">No teams have been created in this department yet.</p>
            ) : (
                <div className="team-grid">
                    {teams.map(team => (
                        <div
                            className="team-card clickable"
                            key={team.id}
                            style={{ position: "relative" }}
                            onClick={() => setSelectedTeam(team)}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#08475E" }}>{team.name}</h3>
                                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                                    <button
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            border: "1px solid #cbd5e1",
                                            background: "#f1f5f9",
                                            cursor: "pointer",
                                            color: "#334155"
                                        }}
                                        onClick={() => handleStartEdit(team)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            border: "1px solid #fecaca",
                                            background: "#fef2f2",
                                            cursor: "pointer",
                                            color: "#b91c1c"
                                        }}
                                        onClick={() => handleDeleteTeam(team)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <p className="team-info" style={{ marginTop: 10 }}>
                                <span className="label">Department:</span> <strong>{team.departmentName || "—"}</strong>
                            </p>
                            <p className="team-info">
                                <span className="label">Team Leader:</span> <strong>{team.teamLeaderName || "Unassigned"}</strong>
                            </p>
                            {team.description && (
                                <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0", lineHeight: 1.4 }}>
                                    {team.description}
                                </p>
                            )}

                            <div className="team-footer" style={{ marginTop: 12 }}>
                                <span>{team.employees?.length || 0} Members</span>
                                <span className="view-details">View Details &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Overlay for Team Details */}
            {selectedTeam && (
                <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedTeam(null)}>&times;</button>
                        <h2>{selectedTeam.name}</h2>
                        <div className="modal-body">
                            <p className="team-desc">
                                <strong>Description:</strong> {selectedTeam.description || 'No description provided.'}
                            </p>
                            <p className="team-info">
                                <strong>Department:</strong> {selectedTeam.departmentName}
                            </p>
                            <p className="team-info">
                                <strong>Team Leader:</strong> {selectedTeam.teamLeaderName || "Unassigned"}
                            </p>
                            
                            <h4 className="mt-4">Team Members ({selectedTeam.employees?.length || 0})</h4>
                            {selectedTeam.employees && selectedTeam.employees.length > 0 ? (
                                <ul className="modal-members-list">
                                    {selectedTeam.employees.map(emp => (
                                        <li key={emp.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div className="employee-avatar small">
                                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>
                                                    {emp.firstName} {emp.lastName}
                                                </div>
                                                <div style={{ fontSize: 11, color: "#64748b" }}>
                                                    {emp.position || emp.professionalDomain || emp.role || "Member"}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-data">No members assigned to this team.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}