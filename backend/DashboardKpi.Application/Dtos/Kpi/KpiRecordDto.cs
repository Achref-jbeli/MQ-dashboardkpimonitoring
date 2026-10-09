namespace DashboardKpi.Application.Dtos.Kpi;

public class KpiRecordDto
{
    public int Id { get; set; }

    public int? ProjectId { get; set; }
    public string? ProjectTitle { get; set; }

    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }

    public int? AddedByEmployeeId { get; set; }
    public string? AddedByName { get; set; }

    public string SourceType { get; set; } = string.Empty;
    public string? SourceIdentifier { get; set; }

    public decimal? CalculatedValue { get; set; }
    public DateTime CalculatedAtUtc { get; set; }
    public string? Formula { get; set; }

    public string? SheetNumber { get; set; }
    public string? Designation { get; set; }
    public string? ModificationReason { get; set; }
    public string? BusinessUnit { get; set; }
    public string? MecType { get; set; }
    public string? DescriptionInZloAev { get; set; }
    public string? Division { get; set; }
    public string? OtpElement { get; set; }
    public string? Responsible { get; set; }
    public string? ResponsibleDepartment { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CreatedOn { get; set; }
    public string? WorkItem { get; set; }
    public string? Tasks { get; set; }
    public string? User { get; set; }
    public string? Function { get; set; }
    public DateTime? SendDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? Done { get; set; }
    public DateTime? DoneDate { get; set; }
    public DateTime? InitialDate { get; set; }
    public string? Note { get; set; }
    public int? Days { get; set; }
    public int? SendEndDate { get; set; }
    public bool? NotReceivedInTime { get; set; }
    public bool? Backlog { get; set; }
    public int? Delay { get; set; }
    public int? LeadTime { get; set; }
    public string? Month { get; set; }
    public DateTime? InitialDateUpdated { get; set; }
    public decimal? AdherenceToSchedule { get; set; }
    public bool Green { get; set; }
    public bool Yellow { get; set; }
    public bool Orange { get; set; }
    public bool Red { get; set; }
}

public class AddKpiDto
{
    public int? ProjectId { get; set; }
    public string? SourceType { get; set; }
    public string? SourceIdentifier { get; set; }
    public decimal? CalculatedValue { get; set; }
    public string? Formula { get; set; }

    public string? SheetNumber { get; set; }
    public string? Designation { get; set; }
    public string? ModificationReason { get; set; }
    public string? BusinessUnit { get; set; }
    public string? MecType { get; set; }
    public string? DescriptionInZloAev { get; set; }
    public string? Division { get; set; }
    public string? OtpElement { get; set; }
    public string? Responsible { get; set; }
    public string? ResponsibleDepartment { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CreatedOn { get; set; }
    public string? WorkItem { get; set; }
    public string? Tasks { get; set; }
    public string? User { get; set; }
    public string? Function { get; set; }
    public DateTime? SendDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? Done { get; set; }
    public DateTime? DoneDate { get; set; }
    public DateTime? InitialDate { get; set; }
    public string? Note { get; set; }
    public int? Days { get; set; }
    public int? SendEndDate { get; set; }
    public bool? NotReceivedInTime { get; set; }
    public bool? Backlog { get; set; }
    public int? Delay { get; set; }
    public int? LeadTime { get; set; }
    public string? Month { get; set; }
    public DateTime? InitialDateUpdated { get; set; }
    public decimal? AdherenceToSchedule { get; set; }
    public bool Green { get; set; }
    public bool Yellow { get; set; }
    public bool Orange { get; set; }
    public bool Red { get; set; }
}

public class UpdateKpiDto : AddKpiDto
{
}
