using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace DashboardKpi.Application.Dtos.Department
{
    public class DepartmentDto
    {
        public int Id { get; set; }

        public required string Name { get; set; } = string.Empty;
    }
}
            