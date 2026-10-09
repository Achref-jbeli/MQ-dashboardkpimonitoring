using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DashboardKpi.Application.Dtos.Project
{
    public class UpdateProjectDto
    {
        public string?  ApiKey{get; set;}

        public string? Title {get; set;}

        public int? DepartmentId { get; set; }

        public int? BusinessUnitId { get; set; }

        public string? Status {get; set;}

        public DateTime? StartDate{get; set;}

        public DateTime? EndDate{get; set;}

    }
}