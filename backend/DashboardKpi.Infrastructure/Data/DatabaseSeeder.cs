using DashboardKpi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DashboardKpi.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedInitialAdminAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeder");

        try
        {
            await db.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KpiDefinitions')
                BEGIN
                    CREATE TABLE [KpiDefinitions] (
                        [Id] int NOT NULL IDENTITY,
                        [DepartmentId] int NULL,
                        [Code] nvarchar(100) NOT NULL,
                        [Name] nvarchar(200) NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [FormulaExpression] nvarchar(500) NOT NULL,
                        [Unit] nvarchar(50) NOT NULL,
                        [DecimalPlaces] int NOT NULL,
                        [GreenThreshold] decimal(18,2) NULL,
                        [YellowThreshold] decimal(18,2) NULL,
                        [OrangeThreshold] decimal(18,2) NULL,
                        [RedThreshold] decimal(18,2) NULL,
                        [IsActive] bit NOT NULL DEFAULT 1,
                        [CreatedAtUtc] datetime2 NOT NULL,
                        [UpdatedAtUtc] datetime2 NULL,
                        CONSTRAINT [PK_KpiDefinitions] PRIMARY KEY ([Id])
                    );
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KpiImportBatches')
                BEGIN
                    CREATE TABLE [KpiImportBatches] (
                        [Id] int NOT NULL IDENTITY,
                        [DepartmentId] int NOT NULL,
                        [ProjectId] int NULL,
                        [SourceType] nvarchar(50) NOT NULL,
                        [FileName] nvarchar(255) NULL,
                        [Status] nvarchar(50) NOT NULL,
                        [TotalRows] int NOT NULL,
                        [SuccessfulRows] int NOT NULL,
                        [FailedRows] int NOT NULL,
                        [ErrorMessage] nvarchar(max) NULL,
                        [DetailsJson] nvarchar(max) NULL,
                        [ImportedAtUtc] datetime2 NOT NULL,
                        CONSTRAINT [PK_KpiImportBatches] PRIMARY KEY ([Id])
                    );
                END

                IF EXISTS (SELECT * FROM sys.tables WHERE name = 'InternationalBusinesses')
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'IsPublicActive')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [IsPublicActive] bit NOT NULL DEFAULT 1;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'IsNewBusiness')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [IsNewBusiness] bit NOT NULL DEFAULT 0;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'ProjectInfo')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [ProjectInfo] nvarchar(max) NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'VolumeLifetime')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [VolumeLifetime] nvarchar(200) NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'SalesLifetime')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [SalesLifetime] nvarchar(200) NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'Sop')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [Sop] nvarchar(100) NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'ProductionLocation')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [ProductionLocation] nvarchar(200) NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'CreatedAtUtc')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [CreatedAtUtc] datetime2 NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('InternationalBusinesses') AND name = 'UpdatedAtUtc')
                    BEGIN
                        ALTER TABLE [InternationalBusinesses] ADD [UpdatedAtUtc] datetime2 NULL;
                    END
                END

                IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Events')
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Events') AND name = 'ImageUrl')
                    BEGIN
                        ALTER TABLE [Events] ADD [ImageUrl] nvarchar(max) NULL;
                    END
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Milestones')
                BEGIN
                    CREATE TABLE [Milestones] (
                        [Id] int NOT NULL IDENTITY,
                        [ProjectId] int NOT NULL,
                        [DepartmentId] int NOT NULL,
                        [Name] nvarchar(255) NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [PlannedDate] datetime2 NULL,
                        [ActualDate] datetime2 NULL,
                        [Status] nvarchar(50) NOT NULL DEFAULT 'Open',
                        [Responsible] nvarchar(150) NULL,
                        [DelayDays] int NULL,
                        [Source] nvarchar(50) NOT NULL DEFAULT 'Manual',
                        [SourceIdentifier] nvarchar(100) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        [UpdatedAt] datetime2 NULL,
                        CONSTRAINT [PK_Milestones] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Milestones_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_Milestones_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE
                    );
                END

                IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'TeamLeaderId')
                    BEGIN
                        ALTER TABLE [Projects] ADD [TeamLeaderId] int NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Projects') AND name = 'IX_Projects_TeamLeaderId')
                    BEGIN
                        CREATE INDEX [IX_Projects_TeamLeaderId] ON [Projects] ([TeamLeaderId]);
                    END
                    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Projects_Employees_TeamLeaderId')
                    BEGIN
                        ALTER TABLE [Projects] ADD CONSTRAINT [FK_Projects_Employees_TeamLeaderId]
                            FOREIGN KEY ([TeamLeaderId]) REFERENCES [Employees] ([Id]) ON DELETE SET NULL;
                    END
                END

                IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Kpis')
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Kpis') AND name = 'AddedByEmployeeId')
                    BEGIN
                        ALTER TABLE [Kpis] ADD [AddedByEmployeeId] int NULL;
                    END
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Kpis') AND name = 'IX_Kpis_AddedByEmployeeId')
                    BEGIN
                        CREATE INDEX [IX_Kpis_AddedByEmployeeId] ON [Kpis] ([AddedByEmployeeId]);
                    END
                    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Kpis_Employees_AddedByEmployeeId')
                    BEGIN
                        ALTER TABLE [Kpis] ADD CONSTRAINT [FK_Kpis_Employees_AddedByEmployeeId]
                            FOREIGN KEY ([AddedByEmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE SET NULL;
                    END
                END
            ");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not ensure KPI tables via raw SQL: {Message}", ex.Message);
        }

        await EnsureBusinessUnitsAsync(db, logger);
        var performanceDepartment = await EnsurePerformanceDepartmentAsync(db, logger);
        await EnsurePerformanceManagerAsync(db, performanceDepartment, logger);
        await EnsureSampleMilestonesAsync(db, performanceDepartment, logger);

        var email = "greenala139@gmail.com";
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var exists = await db.Employees.AnyAsync(employee =>
            employee.Email != null && employee.Email.ToLower() == normalizedEmail);

        if (exists)
        {
            var existingSuperAdmin = await db.Employees.FirstAsync(employee => employee.Email != null && employee.Email.ToLower() == normalizedEmail);
            existingSuperAdmin.Role = "SuperAdmin";
            existingSuperAdmin.Position = "SuperAdmin";
            existingSuperAdmin.DepartmentId = performanceDepartment.Id;
            existingSuperAdmin.Department = performanceDepartment.Name;
            existingSuperAdmin.IsActive = true;
            existingSuperAdmin.IsAccountApproved = true;
            await db.SaveChangesAsync();
            logger.LogInformation("Existing seed account promoted to SuperAdmin for {Email}.", email);
            return;
        }

        var admin = new Employee
        {
            FirstName = "Ala Eddine",
            LastName = "Grine",
            ProfessionalDomain = "Software Engineering",
            Seniority = "Junior",
            Position = "SuperAdmin",
            Role = "SuperAdmin",
            IsActive = true,
            HireDate = DateTime.Parse("2026-07-21T12:45:26.279Z").ToUniversalTime(),
            BirthDate = DateTime.Parse("2003-02-06T12:45:26.279Z").ToUniversalTime(),
            Department = performanceDepartment.Name,
            DepartmentId = performanceDepartment.Id,
            Photo = "",
            Email = email,
            PasswordHash = "E7I+9if8TvPsOC/lgQupzw==./1vkDBjJW3VDJpwvf7nZFIzL/tNJbwZTg4OJdghTdjY=",
            IsAccountApproved = true,
            TwoFactorEnabled = false,
            TwoFactorProvider = null,
            GoogleAuthenticatorSecret = null
        };

        db.Employees.Add(admin);
        await db.SaveChangesAsync();

        logger.LogInformation("Initial admin account seeded successfully for {Email}.", email);
    }

    private static async Task EnsureBusinessUnitsAsync(ApplicationDbContext db, ILogger logger)
    {
        var names = new[] { "HMI", "HIS", "Performance" };

        foreach (var name in names)
        {
            var exists = await db.BusinessUnits.AnyAsync(item => item.Name == name);
            if (!exists)
            {
                db.BusinessUnits.Add(new BusinessUnit { Name = name });
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Business units ensured: HMI, HIS, Performance.");
    }

    private static async Task<Department> EnsurePerformanceDepartmentAsync(ApplicationDbContext db, ILogger logger)
    {
        var performanceBu = await db.BusinessUnits.FirstAsync(item => item.Name == "Performance");
        var department = await db.Departments.FirstOrDefaultAsync(item => item.Name == "PM");

        if (department == null)
        {
            department = new Department
            {
                Name = "PM",
                BusinessUnitId = performanceBu.Id,
            };

            db.Departments.Add(department);
            await db.SaveChangesAsync();
            logger.LogInformation("Department PM seeded successfully.");
            return department;
        }

        if (department.BusinessUnitId != performanceBu.Id)
        {
            department.BusinessUnitId = performanceBu.Id;
            await db.SaveChangesAsync();
        }

        return department;
    }

    private static async Task EnsurePerformanceManagerAsync(ApplicationDbContext db, Department department, ILogger logger)
    {
        const string email = "pm.manager@dashboard.local";
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var exists = await db.Employees.AnyAsync(employee => employee.Email != null && employee.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            return;
        }

        db.Employees.Add(new Employee
        {
            FirstName = "Performance",
            LastName = "Manager",
            Email = email,
            Department = department.Name,
            DepartmentId = department.Id,
            Role = "Manager",
            Position = "Manager",
            ProfessionalDomain = "Performance",
            Seniority = "Lead",
            IsActive = true,
            IsAccountApproved = true,
            TwoFactorEnabled = false,
        });

        await db.SaveChangesAsync();
        logger.LogInformation("Performance manager seed created for {Email}.", email);
    }

    private static async Task EnsureSampleMilestonesAsync(ApplicationDbContext db, Department department, ILogger logger)
    {
        var hasMilestones = await db.Milestones.AnyAsync();
        if (hasMilestones)
        {
            return;
        }

        var projects = await db.Projects
            .Where(p => p.DepartmentId == department.Id || p.DepartmentId == null)
            .Take(5)
            .ToListAsync();

        if (projects.Count == 0)
        {
            // Seed a sample project if none exists
            var hmiBu = await db.BusinessUnits.FirstOrDefaultAsync(b => b.Name == "HMI") ?? await db.BusinessUnits.FirstAsync();
            var sampleProject = new Project
            {
                Title = "HMI Gen 5 Touch Interface",
                Status = "On Track",
                DepartmentId = department.Id,
                BusinessUnitId = hmiBu.Id,
                StartDate = DateTime.UtcNow.AddMonths(-6),
                EndDate = DateTime.UtcNow.AddMonths(6)
            };
            db.Projects.Add(sampleProject);
            await db.SaveChangesAsync();
            projects.Add(sampleProject);
        }

        var now = DateTime.UtcNow;
        var milestonesToSeed = new List<Milestone>();

        foreach (var project in projects)
        {
            // 1. On time (<= 2w)
            milestonesToSeed.Add(new Milestone
            {
                ProjectId = project.Id,
                DepartmentId = project.DepartmentId ?? department.Id,
                Name = $"PEP Phase 1 Concept - {project.Title}",
                Description = "Concept freeze and feasibility sign-off",
                PlannedDate = now.AddDays(-60),
                ActualDate = now.AddDays(-55), // 5 days delay -> On time / <= 2w
                Status = "Completed",
                Responsible = "Lead Engineer",
                DelayDays = 5,
                Source = "Seed",
                CreatedAt = now.AddDays(-90),
                UpdatedAt = now.AddDays(-55)
            });

            // 2. Delay 2-4w
            milestonesToSeed.Add(new Milestone
            {
                ProjectId = project.Id,
                DepartmentId = project.DepartmentId ?? department.Id,
                Name = $"PEP Phase 2 Design Validation - {project.Title}",
                Description = "A-Sample prototype testing & tooling preparation",
                PlannedDate = now.AddDays(-40),
                ActualDate = now.AddDays(-22), // 18 days delay -> Delay 2-4w
                Status = "Completed",
                Responsible = "R&D Project Lead",
                DelayDays = 18,
                Source = "Seed",
                CreatedAt = now.AddDays(-60),
                UpdatedAt = now.AddDays(-22)
            });

            // 3. Delay > 4w
            milestonesToSeed.Add(new Milestone
            {
                ProjectId = project.Id,
                DepartmentId = project.DepartmentId ?? department.Id,
                Name = $"PEP Phase 3 Supplier Qualification - {project.Title}",
                Description = "B-Sample audit and supplier component sign-off",
                PlannedDate = now.AddDays(-45),
                ActualDate = now.AddDays(-10), // 35 days delay -> Delay > 4w
                Status = "Completed",
                Responsible = "Quality Manager",
                DelayDays = 35,
                Source = "Seed",
                CreatedAt = now.AddDays(-60),
                UpdatedAt = now.AddDays(-10)
            });

            // 4. Open (Upcoming / In Progress)
            milestonesToSeed.Add(new Milestone
            {
                ProjectId = project.Id,
                DepartmentId = project.DepartmentId ?? department.Id,
                Name = $"PEP Phase 4 Pre-Series Trial (SOP Prep) - {project.Title}",
                Description = "C-Sample production run and line validation",
                PlannedDate = now.AddDays(30),
                ActualDate = null,
                Status = "Open",
                Responsible = "Plant Industrialization Lead",
                DelayDays = null,
                Source = "Seed",
                CreatedAt = now.AddDays(-30),
                UpdatedAt = now
            });
        }

        db.Milestones.AddRange(milestonesToSeed);
        await db.SaveChangesAsync();
        logger.LogInformation("Sample PEP milestones seeded for {Count} projects.", projects.Count);
    }
}
