using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DashboardKpi.Domain.Entities
{
    public class Department
    {
        public int Id { get; set; }
        public required string Name { get; set; }

        public int? BusinessUnitId { get; set; }

        public BusinessUnit? BusinessUnit { get; set; }

        public int? DepartmentResponsibleId { get; set; }

        public Employee? DepartmentResponsible { get; set; }


        public ICollection<Team> Teams { get; set; }
        = new List<Team>();

        public ICollection<Employee> Employees { get; set; }
        = new List<Employee>();

        public ICollection <Project> Projects { get; set; }
        = new List<Project>();

        public ICollection<Event> Events { get; set; }
        = new List<Event>();

        public ICollection <Kpi> Kpis { get; set; }
        = new List<Kpi>();

        public ICollection<TaskItem> Tasks { get; set; }
        = new List<TaskItem>();

        public ICollection <InternationalBusiness> InternationalBusinesses { get; set; }
        = new List<InternationalBusiness>();

        public ICollection<ExternalApi> ExternalApis { get; set; }
        = new List<ExternalApi>();

        public ICollection<Milestone> Milestones { get; set; }
        = new List<Milestone>();
    }
}