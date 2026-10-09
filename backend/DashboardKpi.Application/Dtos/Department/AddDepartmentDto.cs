using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace DashboardKpi.Application.Dtos.Department
{
    public class AddDepartmentDto
    {
        public required string Name { get; set; } = string.Empty;

        public int? BusinessUnitId { get; set; }
    }
}
        