import { useEffect, useState } from "react";
import "../../styles/TeamPage.css";
import {
    getTeams,
    getAvailableEmployees,
    getTeamLeaders,
    createTeam,
    assignMembers
} from "../../api/TeamApi";
import { getActiveDepartmentId } from "../../utils/departmentScope";

import type {
    TeamDto,
    Employee
} from "../../types/TeamDto";


export function TeamPage() {
    const [teams, setTeams] = useState<TeamDto[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaders, setLeaders] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [teamLeaderId, setTeamLeaderId] = useState(0);

    const [selectedTeam, setSelectedTeam] = useState<TeamDto | null>(null);

    async function load() {
        try {
            const deptId = getActiveDepartmentId() ?? (localStorage.getItem("departmentId") ? Number(localStorage.getItem("departmentId")) : undefined);
            const t = await getTeams(deptId);
            const e = await getAvailableEmployees(deptId);
            const l = await getTeamLeaders(deptId);
            setTeams(t || []);
            setEmployees(e || []);
            setLeaders(l || []);
        } catch (error) {
            console.error("Error loading teams data:", error);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleCreate() {
        if (!name.trim()) {
            alert("Please enter a team name.");
            return;
        }

        if (teamLeaderId === 0) {
            alert("Please select a team leader.");
            return;
        }

        const team = await createTeam({
            name,
            description,
            departmentId: getActiveDepartmentId() ?? Number(localStorage.getItem("departmentId") || "0"),
            teamLeaderId
        });

        if (selectedEmployees.length > 0 && team?.id) {
            await assignMembers(team.id, selectedEmployees);
        }

        setName("");
        setDescription("");
        setTeamLeaderId(0);
        setSelectedEmployees([]);
        load();
    }

    function toggleEmployee(id: number) {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    return (
        <div className="teams-page">
            <h1 className="teams-title">Teams Management</h1>

            <div className="team-create-card">
                <h2 className="section-title">Create New Team</h2>
                
                <div className="form-group">
                    <input
                        className="team-input"
                        placeholder="Team Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <textarea
                        className="team-input"
                        placeholder="Team Description (Optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>
                <div className="form-group">
                    <select
                        className="team-input"
                        value={teamLeaderId}
                        onChange={e => setTeamLeaderId(Number(e.target.value))}
                    >
                        <option value={0}>Select Team Leader</option>
                        {leaders.map(leader => (
                            <option key={leader.id} value={leader.id}>
                                {leader.firstName} {leader.lastName} - {leader.professionalDomain}
                            </option>
                        ))}
                    </select>
                </div>

                <h3 className="section-title mt-4">Select Members</h3>
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
                                        <span className="domain-badge">{emp.professionalDomain || 'No Domain'}</span>
                                    </div>
                                </div>
                                <div className={`selection-indicator ${isSelected ? 'active' : ''}`}>
                                    ✓
                                </div>
                            </div>
                        );
                    })}
                    {employees.length === 0 && (
                        <p className="no-data">No available employees to assign.</p>
                    )}
                </div>

                <button className="primary-btn mt-4" onClick={handleCreate}>
                    Create Team
                </button>
            </div>

            <h2 className="section-title">Existing Teams</h2>
            <div className="team-grid">
                {teams.length === 0 ? (
                    <p className="no-data">No teams have been created yet.</p>
                ) : (
                    teams.map(team => (
                        <div
                            className="team-card clickable"
                            key={team.id}
                            onClick={() => setSelectedTeam(team)}
                        >
                            <h3>{team.name}</h3>
                            <p className="team-info">
                                <span className="label">Leader:</span> {team.teamLeaderName}
                            </p>
                            <p className="team-info">
                                <span className="label">Department:</span> {team.departmentName}
                            </p>
                            <div className="team-footer">
                                <span>{team.employees?.length || 0} Members</span>
                                <span className="view-details">View Details &rarr;</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

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
                                <strong>Team Leader:</strong> {selectedTeam.teamLeaderName}
                            </p>
                            
                            <h4 className="mt-4">Members ({selectedTeam.employees?.length || 0})</h4>
                            {selectedTeam.employees && selectedTeam.employees.length > 0 ? (
                                <ul className="modal-members-list">
                                    {selectedTeam.employees.map(emp => (
                                        <li key={emp.id}>
                                            <div className="employee-avatar small">
                                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                            </div>
                                            <span>{emp.firstName} {emp.lastName}</span>
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