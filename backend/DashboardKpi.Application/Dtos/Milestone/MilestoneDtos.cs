using System;
using System.Collections.Generic;

namespace DashboardKpi.Application.Dtos.Milestone
{
    public class MilestoneDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string? ProjectTitle { get; set; }
        public int DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? PlannedDate { get; set; }
        public DateTime? ActualDate { get; set; }
        public string Status { get; set; } = "Open";
        public string? Responsible { get; set; }
        public int? DelayDays { get; set; }
        public string Source { get; set; } = "Manual";
        public string? SourceIdentifier { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateMilestoneDto
    {
        public int ProjectId { get; set; }
        public int DepartmentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? PlannedDate { get; set; }
        public DateTime? ActualDate { get; set; }
        public string Status { get; set; } = "Open";
        public string? Responsible { get; set; }
    }

    public class UpdateMilestoneDto
    {
        public int? ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? PlannedDate { get; set; }
        public DateTime? ActualDate { get; set; }
        public string Status { get; set; } = "Open";
        public string? Responsible { get; set; }
    }

    public class PepMilestoneDistributionDto
    {
        public int OnTimeCount { get; set; }
        public int Delay2To4WeeksCount { get; set; }
        public int DelayMoreThan4WeeksCount { get; set; }
        public int OpenCount { get; set; }
        public int TotalCount { get; set; }

        public decimal OnTimePercentage { get; set; }
        public decimal Delay2To4WeeksPercentage { get; set; }
        public decimal DelayMoreThan4WeeksPercentage { get; set; }
        public decimal OpenPercentage { get; set; }

        public int TotalProjects { get; set; }
        public int TotalMilestones { get; set; }
        public int CompletedMilestones { get; set; }
        public int OpenMilestones { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal AverageDelayDays { get; set; }

        public List<PepMilestoneItemDto> Items { get; set; } = new();
    }

    public class PepMilestoneItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public DateTime? PlannedDate { get; set; }
        public DateTime? ActualDate { get; set; }
        public string Category { get; set; } = string.Empty; // "On time / <= 2w", "Delay 2-4w", "Delay > 4w", "Open"
        public int? DelayDays { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Responsible { get; set; }
    }

    public class RealizationStatusDto
    {
        public List<RealizationPeriodDto> Periods { get; set; } = new();
        public RealizationSummaryDto Summary { get; set; } = new();
    }

    public class RealizationPeriodDto
    {
        public string Month { get; set; } = string.Empty;
        public int MonthNumber { get; set; }
        public int Year { get; set; }
        public string PeriodLabel { get; set; } = string.Empty;
        public decimal RealizedValue { get; set; }
        public decimal PlannedValue { get; set; }
        public decimal? ForecastValue { get; set; }
        public decimal? TargetValue { get; set; }
        public decimal VarianceToTarget { get; set; }
        public decimal RealizationRate { get; set; }
    }

    public class RealizationSummaryDto
    {
        public decimal TotalRealized { get; set; }
        public decimal TotalPlanned { get; set; }
        public decimal? TotalForecast { get; set; }
        public decimal? TotalTarget { get; set; }
        public decimal OverallRealizationRate { get; set; }
        public decimal Variance { get; set; }
    }
}
