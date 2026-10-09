using DashboardKpi.Domain.Entities;
using DocumentFormat.OpenXml.Office2016.Excel;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Data;
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<BusinessUnit> BusinessUnits { get; set; }
    public DbSet<Kpi> Kpis { get; set; }
    public DbSet<TwoFactorChallenge> TwoFactorChallenges {get;set;}
    public DbSet<Department> Departments { get; set; }
    public DbSet<ExternalApi> ExternalApis { get; set; }
    public DbSet<DataExtractionApi> DataExtractionApis { get; set; }
    public DbSet<DataProcessingApi> DataProcessingApis { get; set; }
    public DbSet<DataCalculationApi> DataCalculationApis { get; set; }
    public DbSet<KpiDefinition> KpiDefinitions { get; set; }
    public DbSet<KpiImportBatch> KpiImportBatches { get; set; }
    public DbSet<TwoFactorConfigurations> TwoFactorConfigurations {get;set;}
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<InternationalBusiness> InternationalBusinesses{get;set;}
    public DbSet<Milestone> Milestones { get; set; }
    public DbSet<RealizationEntry> RealizationEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Team>()
            .HasOne(t => t.Department)
            .WithMany(d => d.Teams)
            .HasForeignKey(t => t.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RealizationEntry>()
            .HasIndex(r => new { r.DepartmentId, r.Year, r.Month })
            .IsUnique();

        modelBuilder.Entity<RealizationEntry>()
            .Property(r => r.PlannedValue)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<RealizationEntry>()
            .Property(r => r.RealizedValue)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<RealizationEntry>()
            .Property(r => r.TargetValue)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<RealizationEntry>()
            .Property(r => r.ForecastValue)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<Team>()
            .HasOne(t => t.TeamLeader)
            .WithMany()
            .HasForeignKey(t => t.TeamLeaderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Team)
            .WithMany(t => t.Employees)
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.DepartmentEntity)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Department>()
            .HasOne(department => department.BusinessUnit)
            .WithMany(businessUnit => businessUnit.Departments)
            .HasForeignKey(department => department.BusinessUnitId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Project>()
            .HasOne(p => p.Department)
            .WithMany(d => d.Projects)
            .HasForeignKey(p => p.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Project>()
            .HasOne(p => p.TeamLeader)
            .WithMany()
            .HasForeignKey(p => p.TeamLeaderId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<InternationalBusiness>()
            .HasOne(business => business.Department)
            .WithMany(department => department.InternationalBusinesses)
            .HasForeignKey(business => business.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);


        modelBuilder.Entity<Project>()
            .HasOne(p => p.BusinessUnit)
            .WithMany()
            .HasForeignKey(p => p.BusinessUnitId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Event>()
            .HasOne(e => e.Department)
            .WithMany(d => d.Events)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Kpi>()
            .HasOne(k => k.Department)
            .WithMany(d => d.Kpis)
            .HasForeignKey(k => k.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TaskItem>()
            .HasOne(task => task.Department)
            .WithMany(department => department.Tasks)
            .HasForeignKey(task => task.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Milestone>()
            .HasOne(m => m.Department)
            .WithMany(d => d.Milestones)
            .HasForeignKey(m => m.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Milestone>()
            .HasOne(m => m.Project)
            .WithMany(p => p.Milestones)
            .HasForeignKey(m => m.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
        
        var stringListComparer = new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
            (c1, c2) => c1 != null && c2 != null ? c1.SequenceEqual(c2) : c1 == c2,
            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c.ToList());

        modelBuilder.Entity<InternationalBusiness>()
            .Property(e => e.Photos)
            .HasConversion(
                v => string.Join(';', v ?? new List<string>()),
                v => v == null ? new List<string>() : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList(),
                stringListComparer
            );

        modelBuilder.Entity<TaskItem>()
            .HasOne(task => task.Team)
            .WithMany(team => team.Tasks)
            .HasForeignKey(task => task.TeamId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TaskItem>()
            .HasOne(task => task.Project)
            .WithMany(project => project.Tasks)
            .HasForeignKey(task => task.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TaskItem>()
            .HasOne(task => task.Assignee)
            .WithMany(employee => employee.AssignedTasks)
            .HasForeignKey(task => task.AssigneeId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<TaskItem>()
            .HasOne(task => task.TeamLeader)
            .WithMany(employee => employee.ResponsibleTasks)
            .HasForeignKey(task => task.TeamLeaderId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Kpi>()
            .HasOne(k => k.Project)
            .WithMany()
            .HasForeignKey(k => k.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Kpi>()
            .HasOne(k => k.AddedByEmployee)
            .WithMany()
            .HasForeignKey(k => k.AddedByEmployeeId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Kpi>()
            .Property(x => x.AdherenceToSchedule)
            .HasColumnType("decimal(5,2)");

        modelBuilder.Entity<Kpi>()
            .Property(x => x.CalculatedValue)
            .HasColumnType("decimal(18,4)");

        modelBuilder.Entity<Department>()
            .HasOne(department => department.DepartmentResponsible)
            .WithMany()
            .HasForeignKey(department => department.DepartmentResponsibleId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BusinessUnit>()
            .HasIndex(businessUnit => businessUnit.Name)
            .IsUnique();

        modelBuilder.Entity<ExternalApi>()
            .HasDiscriminator<string>("ApiKind")
            .HasValue<ExternalApi>("ExternalApi")
            .HasValue<DataExtractionApi>("DataExtractionApi")
            .HasValue<DataProcessingApi>("DataProcessingApi")
            .HasValue<DataCalculationApi>("DataCalculationApi");

        modelBuilder.Entity<ExternalApi>()
            .HasOne(externalApi => externalApi.Project)
            .WithMany(project => project.ExternalApis)
            .HasForeignKey(externalApi => externalApi.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExternalApi>()
            .HasOne(externalApi => externalApi.Department)
            .WithMany(department => department.ExternalApis)
            .HasForeignKey(externalApi => externalApi.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public DbSet<AccountCreationRequest> AccountCreationRequests { get; set; }


}