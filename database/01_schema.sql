-- DashboardKpiDB Schema Export
-- Generated: 2026-10-09 11:31:57
-- SQL Server 2022

USE [master];
GO
IF DB_ID('DashboardKpiDB') IS NOT NULL
    DROP DATABASE [DashboardKpiDB];
GO
CREATE DATABASE [DashboardKpiDB];
GO
USE [DashboardKpiDB];
GO

CREATE TABLE [__EFMigrationsHistory] (
    [MigrationId] nvarchar(150) NOT NULL,
    [ProductVersion] nvarchar(32) NOT NULL
);
GO

CREATE TABLE [AccountCreationRequests] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [EmployeeId] int NOT NULL,
    [Email] nvarchar(MAX) NOT NULL,
    [RequestedRole] nvarchar(MAX) NOT NULL,
    [PasswordHash] nvarchar(MAX) NOT NULL,
    [TwoFactorProvider] nvarchar(MAX) NULL,
    [GoogleAuthenticatorSecret] nvarchar(MAX) NULL,
    [Status] nvarchar(MAX) NOT NULL,
    [RequestedAtUtc] datetime2 NOT NULL,
    [ReviewedAtUtc] datetime2 NULL,
    [ReviewedByAdminId] int NULL,
    [RejectionReason] nvarchar(MAX) NULL
);
GO

CREATE TABLE [BusinessUnits] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(450) NOT NULL
);
GO

CREATE TABLE [Departments] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(MAX) NOT NULL,
    [BusinessUnitId] int NULL,
    [DepartmentResponsibleId] int NULL
);
GO

CREATE TABLE [Employees] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [FirstName] nvarchar(MAX) NOT NULL,
    [LastName] nvarchar(MAX) NOT NULL,
    [Email] nvarchar(MAX) NULL,
    [PasswordHash] nvarchar(MAX) NULL,
    [ProfessionalDomain] nvarchar(MAX) NULL,
    [Seniority] nvarchar(MAX) NULL,
    [BirthDate] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [Position] nvarchar(MAX) NULL,
    [HireDate] datetime2 NULL,
    [Department] nvarchar(MAX) NULL,
    [DepartmentId] int NULL,
    [Photo] nvarchar(MAX) NULL,
    [Role] nvarchar(MAX) NULL,
    [IsAccountApproved] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [TwoFactorProvider] nvarchar(MAX) NULL,
    [GoogleAuthenticatorSecret] nvarchar(MAX) NULL,
    [TeamId] int NULL
);
GO

CREATE TABLE [Events] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Title] nvarchar(MAX) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [Date] datetime2 NULL,
    [Location] nvarchar(MAX) NULL,
    [Type] nvarchar(MAX) NULL,
    [ImageUrl] nvarchar(MAX) NULL,
    [DepartmentId] int NULL,
    [EmployeeId] int NULL
);
GO

CREATE TABLE [ExternalApis] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(MAX) NULL,
    [BaseUrl] nvarchar(MAX) NULL,
    [ApiKey] nvarchar(MAX) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [LastSyncedAtUtc] datetime2 NULL,
    [ProjectId] int NOT NULL,
    [DepartmentId] int NOT NULL,
    [ApiKind] nvarchar(21) NOT NULL,
    [KpiLabel] nvarchar(MAX) NULL,
    [FormulaExpression] nvarchar(MAX) NULL,
    [Unit] nvarchar(MAX) NULL,
    [DecimalPlaces] int NULL,
    [SourceType] nvarchar(MAX) NULL,
    [EndpointPath] nvarchar(MAX) NULL,
    [CsvDelimiter] nvarchar(MAX) NULL,
    [RulesJson] nvarchar(MAX) NULL,
    [Notes] nvarchar(MAX) NULL
);
GO

CREATE TABLE [InternationalBusinesses] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(MAX) NULL,
    [DepartmentId] int NOT NULL,
    [Country] nvarchar(MAX) NULL,
    [PartnerName] nvarchar(MAX) NULL,
    [Description] nvarchar(MAX) NULL,
    [Photos] nvarchar(MAX) NULL,
    [IsPublicActive] bit NOT NULL,
    [IsNewBusiness] bit NOT NULL,
    [ProjectInfo] nvarchar(MAX) NULL,
    [VolumeLifetime] nvarchar(MAX) NULL,
    [SalesLifetime] nvarchar(MAX) NULL,
    [Sop] nvarchar(MAX) NULL,
    [ProductionLocation] nvarchar(MAX) NULL,
    [CreatedAtUtc] datetime2 NULL,
    [UpdatedAtUtc] datetime2 NULL
);
GO

CREATE TABLE [KpiDefinitions] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [DepartmentId] int NULL,
    [Code] nvarchar(MAX) NOT NULL,
    [Name] nvarchar(MAX) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [FormulaExpression] nvarchar(MAX) NOT NULL,
    [Unit] nvarchar(MAX) NOT NULL,
    [DecimalPlaces] int NOT NULL,
    [GreenThreshold] decimal(18,2) NOT NULL,
    [YellowThreshold] decimal(18,2) NOT NULL,
    [OrangeThreshold] decimal(18,2) NOT NULL,
    [RedThreshold] decimal(18,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [Version] int NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL
);
GO

CREATE TABLE [KpiImportBatches] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [DepartmentId] int NOT NULL,
    [ProjectId] int NULL,
    [SourceType] nvarchar(MAX) NOT NULL,
    [FileName] nvarchar(MAX) NULL,
    [ImportedAtUtc] datetime2 NOT NULL,
    [Status] nvarchar(MAX) NOT NULL,
    [TotalRows] int NOT NULL,
    [SuccessfulRows] int NOT NULL,
    [FailedRows] int NOT NULL,
    [ErrorMessage] nvarchar(MAX) NULL,
    [DetailsJson] nvarchar(MAX) NULL
);
GO

CREATE TABLE [Kpis] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [ProjectId] int NULL,
    [SourceType] nvarchar(MAX) NOT NULL,
    [SourceIdentifier] nvarchar(MAX) NULL,
    [CalculatedValue] decimal(18,4) NULL,
    [CalculatedAtUtc] datetime2 NOT NULL,
    [Formula] nvarchar(MAX) NULL,
    [SheetNumber] nvarchar(MAX) NULL,
    [Designation] nvarchar(MAX) NULL,
    [ModificationReason] nvarchar(MAX) NULL,
    [BusinessUnit] nvarchar(MAX) NULL,
    [MecType] nvarchar(MAX) NULL,
    [DescriptionInZloAev] nvarchar(MAX) NULL,
    [Division] nvarchar(MAX) NULL,
    [OtpElement] nvarchar(MAX) NULL,
    [Responsible] nvarchar(MAX) NULL,
    [ResponsibleDepartment] nvarchar(MAX) NULL,
    [CreatedBy] nvarchar(MAX) NULL,
    [CreatedOn] datetime2 NULL,
    [WorkItem] nvarchar(MAX) NULL,
    [Tasks] nvarchar(MAX) NULL,
    [User] nvarchar(MAX) NULL,
    [Function] nvarchar(MAX) NULL,
    [SendDate] datetime2 NULL,
    [EndDate] datetime2 NULL,
    [Done] bit NULL,
    [DoneDate] datetime2 NULL,
    [InitialDate] datetime2 NULL,
    [Note] nvarchar(MAX) NULL,
    [Days] int NULL,
    [SendEndDate] int NULL,
    [NotReceivedInTime] bit NULL,
    [Backlog] bit NULL,
    [Delay] int NULL,
    [LeadTime] int NULL,
    [Month] nvarchar(MAX) NULL,
    [InitialDateUpdated] datetime2 NULL,
    [AdherenceToSchedule] decimal(5,2) NULL,
    [Green] bit NOT NULL,
    [Yellow] bit NOT NULL,
    [Orange] bit NOT NULL,
    [Red] bit NOT NULL,
    [DepartmentId] int NULL,
    [AddedByEmployeeId] int NULL
);
GO

CREATE TABLE [Milestones] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [ProjectId] int NOT NULL,
    [DepartmentId] int NOT NULL,
    [Name] nvarchar(MAX) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [PlannedDate] datetime2 NULL,
    [ActualDate] datetime2 NULL,
    [Status] nvarchar(MAX) NOT NULL,
    [Responsible] nvarchar(MAX) NULL,
    [DelayDays] int NULL,
    [Source] nvarchar(MAX) NOT NULL,
    [SourceIdentifier] nvarchar(MAX) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL
);
GO

CREATE TABLE [Projects] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [ApiKey] nvarchar(MAX) NULL,
    [Title] nvarchar(MAX) NULL,
    [BusinessUnitId] int NULL,
    [Status] nvarchar(MAX) NULL,
    [StartDate] datetime2 NULL,
    [EndDate] datetime2 NULL,
    [DepartmentId] int NULL,
    [TeamLeaderId] int NULL
);
GO

CREATE TABLE [RealizationEntries] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [DepartmentId] int NOT NULL,
    [Month] int NOT NULL,
    [Year] int NOT NULL,
    [PlannedValue] decimal(18,2) NOT NULL,
    [RealizedValue] decimal(18,2) NOT NULL,
    [TargetValue] decimal(18,2) NULL,
    [ForecastValue] decimal(18,2) NULL,
    [UpdatedAt] datetime2 NOT NULL
);
GO

CREATE TABLE [Tasks] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Title] nvarchar(MAX) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [ChangeNumber] nvarchar(MAX) NULL,
    [ReasonForChange] nvarchar(MAX) NULL,
    [BusinessUnit] nvarchar(MAX) NULL,
    [MecType] nvarchar(MAX) NULL,
    [Plant] nvarchar(MAX) NULL,
    [WbsElement] nvarchar(MAX) NULL,
    [WorkItem] nvarchar(MAX) NULL,
    [Function] nvarchar(MAX) NULL,
    [Note] nvarchar(MAX) NULL,
    [SourceMonth] nvarchar(MAX) NULL,
    [Status] nvarchar(MAX) NOT NULL,
    [Progress] int NOT NULL,
    [PerformanceScore] int NOT NULL,
    [ResponsibleName] nvarchar(MAX) NULL,
    [ResponsibleDepartment] nvarchar(MAX) NULL,
    [CreatedBy] nvarchar(MAX) NULL,
    [AssigneeName] nvarchar(MAX) NULL,
    [CreatedOn] datetime2 NULL,
    [SendDate] datetime2 NULL,
    [DueDate] datetime2 NULL,
    [CompletedAt] datetime2 NULL,
    [InitialDate] datetime2 NULL,
    [ForwardedDate] datetime2 NULL,
    [Days] int NULL,
    [DepartmentId] int NOT NULL,
    [TeamId] int NULL,
    [ProjectId] int NULL,
    [AssigneeId] int NULL,
    [TeamLeaderId] int NULL
);
GO

CREATE TABLE [Teams] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(MAX) NULL,
    [DepartmentId] int NOT NULL,
    [TeamLeaderId] int NOT NULL
);
GO

CREATE TABLE [TwoFactorChallenges] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [EmployeeId] int NOT NULL,
    [Code] nvarchar(MAX) NOT NULL,
    [Expiration] datetime2 NOT NULL,
    [Used] bit NOT NULL,
    [codeHash] nvarchar(MAX) NOT NULL
);
GO

CREATE TABLE [TwoFactorConfigurations] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [EmployeeId] int NOT NULL,
    [Enabled] bit NOT NULL,
    [Provider] nvarchar(MAX) NOT NULL,
    [SecretKey] nvarchar(MAX) NULL,
    [CreatedAt] datetime2 NOT NULL
);
GO

