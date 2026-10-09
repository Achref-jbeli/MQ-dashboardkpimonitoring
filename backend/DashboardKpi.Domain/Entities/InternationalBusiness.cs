using System;
using System.Collections.Generic;

namespace DashboardKpi.Domain.Entities
{
    public class InternationalBusiness
    {
        public int Id { get; set; }
        
        public string? Name { get; set; }

        public int DepartmentId { get; set; }
        public Department? Department { get; set; }
        public string? Country { get; set; }
        public string? PartnerName { get; set; }

        public string? Description { get; set; }

        public List<string>? Photos { get; set; }

        public bool IsPublicActive { get; set; } = true;
        public bool IsNewBusiness { get; set; } = false;

        public string? ProjectInfo { get; set; }
        public string? VolumeLifetime { get; set; }
        public string? SalesLifetime { get; set; }
        public string? Sop { get; set; }
        public string? ProductionLocation { get; set; }

        public DateTime? CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}