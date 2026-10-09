namespace DashboardKpi.Domain.Entities;

public class Kpi
{
    public int Id { get; set; }

    // Project & Source scoping
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    public string SourceType { get; set; } = string.Empty; // Excel, Csv, Jira, Performance, Manual
    public string? SourceIdentifier { get; set; }

    public decimal? CalculatedValue { get; set; }
    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;

    // Formula definition / source formula
    public string? Formula { get; set; }

    // A - N° FicheM.
    public string? SheetNumber { get; set; }

    // B - Désignation
    public string? Designation { get; set; }

    // C - Motif modification
    public string? ModificationReason { get; set; }

    // D - Bus. unit
    public string? BusinessUnit { get; set; }

    // E - MEC-Type
    public string? MecType { get; set; }

    // F - Description in ZLO_AEV
    public string? DescriptionInZloAev { get; set; }

    // G - Division
    public string? Division { get; set; }

    // H - Elt OTP
    public string? OtpElement { get; set; }

    // I - Responsible
    public string? Responsible { get; set; }

    // J - Resp_Dep
    public string? ResponsibleDepartment { get; set; }

    // K - Created by
    public string? CreatedBy { get; set; }

    // L - Created On
    public DateTime? CreatedOn { get; set; }

    // M - WrkIt
    public string? WorkItem { get; set; }

    // N - Tasks
    public string? Tasks { get; set; }

    // O - User
    public string? User { get; set; }

    // P - Function
    public string? Function { get; set; }

    // Q - Send date
    public DateTime? SendDate { get; set; }

    // R - End date
    public DateTime? EndDate { get; set; }

    // S - Done
    public bool? Done { get; set; }
    public DateTime? DoneDate { get; set; }

    // T - Init/date
    public DateTime? InitialDate { get; set; }

    // U - Note
    public string? Note { get; set; }

    // V - Days
    public int? Days { get; set; }

    // W - Send-End date
    public int? SendEndDate { get; set; }

    // X - not received in time?
    public bool? NotReceivedInTime { get; set; }

    // Y - Backlog
    public bool? Backlog { get; set; }

    // Z - Delay
    public int? Delay { get; set; }

    // AA - Lead time
    public int? LeadTime { get; set; }

    // AB - Month
    public string? Month { get; set; }

    // AC - Initial Date updated
    public DateTime? InitialDateUpdated { get; set; }

    // AD - adh to schedule
    public decimal? AdherenceToSchedule { get; set; }

    // AE - Green
    public bool Green { get; set; }

    // AF - Yellow
    public bool Yellow { get; set; }

    // AG - Orange
    public bool Orange { get; set; }

    // AH - Red
    public bool Red { get; set; }

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    // Employee who manually created/added this KPI record (used to scope TeamLeader visibility).
    public int? AddedByEmployeeId { get; set; }
    public Employee? AddedByEmployee { get; set; }
}