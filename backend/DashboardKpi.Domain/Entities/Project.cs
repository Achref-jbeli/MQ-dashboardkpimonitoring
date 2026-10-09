using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DashboardKpi.Domain.Entities
{
    public class Project
    {
        public int Id{get; set;}
        public string?  ApiKey{get; set;}

        public string? Title {get; set;}

        public int? BusinessUnitId { get; set; }
        public BusinessUnit BusinessUnit { get; set; } = null!;


        public string? Status {get; set;}

        public DateTime? StartDate{get; set;}

        public DateTime? EndDate{get; set;}

        public int? DepartmentId { get; set; }

        public Department? Department { get; set; }

        public int? TeamLeaderId { get; set; }

        public Employee? TeamLeader { get; set; }

        public ICollection<ExternalApi> ExternalApis { get; set; }
        = new List<ExternalApi>();

        public ICollection<TaskItem> Tasks { get; set; }
        = new List<TaskItem>();

        public ICollection<Milestone> Milestones { get; set; }
        = new List<Milestone>();
    }
}