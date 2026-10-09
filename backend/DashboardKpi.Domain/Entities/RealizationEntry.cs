namespace DashboardKpi.Domain.Entities
{
    public class RealizationEntry
    {
        public int Id { get; set; }

        public int DepartmentId { get; set; }
        public Department Department { get; set; } = null!;

        /// <summary>1 – 12</summary>
        public int Month { get; set; }

        public int Year { get; set; }

        /// <summary>Cumulative planned value for this period (admin-entered)</summary>
        public decimal PlannedValue { get; set; }

        /// <summary>Cumulative realized value for this period (admin-entered)</summary>
        public decimal RealizedValue { get; set; }

        /// <summary>Optional target override for this period</summary>
        public decimal? TargetValue { get; set; }

        /// <summary>Optional forecast value for this period</summary>
        public decimal? ForecastValue { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
