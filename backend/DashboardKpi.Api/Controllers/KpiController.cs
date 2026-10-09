using DashboardKpi.Api.Extensions;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kpi = DashboardKpi.Domain.Entities.Kpi;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
public class KpiController : ControllerBase
{
    private readonly IKpiImportOrchestrator _kpiOrchestrator;
    private readonly IKpiImportService _importService;
    private readonly ApplicationDbContext _context;

    public KpiController(IKpiImportOrchestrator kpiOrchestrator, IKpiImportService importService, ApplicationDbContext context)
    {
        _kpiOrchestrator = kpiOrchestrator;
        _importService = importService;
        _context = context;
    }

    [HttpGet("adherence-to-schedule")]
    public async Task<ActionResult<IReadOnlyList<MonthlyAdherenceDto>>> GetAdherenceToSchedule(
        [FromQuery] int? departmentId = null,
        [FromQuery] int? projectId = null,
        [FromQuery] string? businessUnit = null,
        [FromQuery] int? year = null,
        [FromQuery] string? responsibleDepartments = null,
        CancellationToken cancellationToken = default)
    {
        var targetDepartmentId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
        if (!targetDepartmentId.HasValue)
        {
            return Forbid();
        }

        var respDepts = string.IsNullOrWhiteSpace(responsibleDepartments)
            ? null
            : responsibleDepartments.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                    .ToList();

        var results = await _importService.GetMonthlyAdherenceAsync(
            targetDepartmentId.Value,
            projectId,
            businessUnit,
            year,
            respDepts,
            cancellationToken);

        return Ok(results);
    }

    // TeamLeaders only see KPIs they personally added or that belong to a project assigned to them.
    private bool IsTeamLeaderOnly() => User.IsInRole("TeamLeader") && !User.IsInRole("Administrator") && !User.IsInRole("SuperAdmin") && !User.IsInRole("Manager");

    private IQueryable<Kpi> ApplyTeamLeaderScope(IQueryable<Kpi> query)
    {
        if (!IsTeamLeaderOnly() || !User.TryGetEmployeeId(out var employeeId))
        {
            return query;
        }

        return query.Where(k =>
            k.AddedByEmployeeId == employeeId ||
            (k.ProjectId != null && k.Project!.TeamLeaderId == employeeId));
    }

    private static KpiRecordDto MapToDto(Kpi kpi) => new()
    {
        Id = kpi.Id,
        ProjectId = kpi.ProjectId,
        ProjectTitle = kpi.Project?.Title,
        DepartmentId = kpi.DepartmentId,
        DepartmentName = kpi.Department?.Name,
        AddedByEmployeeId = kpi.AddedByEmployeeId,
        AddedByName = kpi.AddedByEmployee != null ? $"{kpi.AddedByEmployee.FirstName} {kpi.AddedByEmployee.LastName}" : null,
        SourceType = kpi.SourceType,
        SourceIdentifier = kpi.SourceIdentifier,
        CalculatedValue = kpi.CalculatedValue,
        CalculatedAtUtc = kpi.CalculatedAtUtc,
        Formula = kpi.Formula,
        SheetNumber = kpi.SheetNumber,
        Designation = kpi.Designation,
        ModificationReason = kpi.ModificationReason,
        BusinessUnit = kpi.BusinessUnit,
        MecType = kpi.MecType,
        DescriptionInZloAev = kpi.DescriptionInZloAev,
        Division = kpi.Division,
        OtpElement = kpi.OtpElement,
        Responsible = kpi.Responsible,
        ResponsibleDepartment = kpi.ResponsibleDepartment,
        CreatedBy = kpi.CreatedBy,
        CreatedOn = kpi.CreatedOn,
        WorkItem = kpi.WorkItem,
        Tasks = kpi.Tasks,
        User = kpi.User,
        Function = kpi.Function,
        SendDate = kpi.SendDate,
        EndDate = kpi.EndDate,
        Done = kpi.Done,
        DoneDate = kpi.DoneDate,
        InitialDate = kpi.InitialDate,
        Note = kpi.Note,
        Days = kpi.Days,
        SendEndDate = kpi.SendEndDate,
        NotReceivedInTime = kpi.NotReceivedInTime,
        Backlog = kpi.Backlog,
        Delay = kpi.Delay,
        LeadTime = kpi.LeadTime,
        Month = kpi.Month,
        InitialDateUpdated = kpi.InitialDateUpdated,
        AdherenceToSchedule = kpi.AdherenceToSchedule,
        Green = kpi.Green,
        Yellow = kpi.Yellow,
        Orange = kpi.Orange,
        Red = kpi.Red,
    };

    private static void ApplyDto(Kpi kpi, AddKpiDto dto)
    {
        kpi.ProjectId = dto.ProjectId;
        kpi.SourceType = string.IsNullOrWhiteSpace(dto.SourceType) ? "Manual" : dto.SourceType!;
        kpi.SourceIdentifier = dto.SourceIdentifier;
        kpi.CalculatedValue = dto.CalculatedValue;
        kpi.Formula = dto.Formula;
        kpi.SheetNumber = dto.SheetNumber;
        kpi.Designation = dto.Designation;
        kpi.ModificationReason = dto.ModificationReason;
        kpi.BusinessUnit = dto.BusinessUnit;
        kpi.MecType = dto.MecType;
        kpi.DescriptionInZloAev = dto.DescriptionInZloAev;
        kpi.Division = dto.Division;
        kpi.OtpElement = dto.OtpElement;
        kpi.Responsible = dto.Responsible;
        kpi.ResponsibleDepartment = dto.ResponsibleDepartment;
        kpi.CreatedBy = dto.CreatedBy;
        kpi.CreatedOn = dto.CreatedOn;
        kpi.WorkItem = dto.WorkItem;
        kpi.Tasks = dto.Tasks;
        kpi.User = dto.User;
        kpi.Function = dto.Function;
        kpi.SendDate = dto.SendDate;
        kpi.EndDate = dto.EndDate;
        kpi.Done = dto.Done;
        kpi.DoneDate = dto.DoneDate;
        kpi.InitialDate = dto.InitialDate;
        kpi.Note = dto.Note;
        kpi.Days = dto.Days;
        kpi.SendEndDate = dto.SendEndDate;
        kpi.NotReceivedInTime = dto.NotReceivedInTime;
        kpi.Backlog = dto.Backlog;
        kpi.Delay = dto.Delay;
        kpi.LeadTime = dto.LeadTime;
        kpi.Month = dto.Month;
        kpi.InitialDateUpdated = dto.InitialDateUpdated;
        kpi.AdherenceToSchedule = dto.AdherenceToSchedule;
        kpi.Green = dto.Green;
        kpi.Yellow = dto.Yellow;
        kpi.Orange = dto.Orange;
        kpi.Red = dto.Red;
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords(
        [FromQuery] int? departmentId = null,
        [FromQuery] int? projectId = null,
        [FromQuery] string? businessUnit = null)
    {
        var query = _context.Set<Kpi>()
            .AsNoTracking()
            .Include(k => k.Project)
            .Include(k => k.Department)
            .Include(k => k.AddedByEmployee)
            .AsQueryable();

        if (User.IsSuperAdmin())
        {
            if (departmentId.HasValue)
            {
                query = query.Where(k => k.DepartmentId == departmentId.Value);
            }
            // else: SuperAdmin with no department specified sees KPI records across all departments.
        }
        else
        {
            var targetDepartmentId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
            if (!targetDepartmentId.HasValue)
            {
                return Forbid();
            }

            query = query.Where(k => k.DepartmentId == targetDepartmentId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(k => k.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(businessUnit))
        {
            query = query.Where(k => k.BusinessUnit == businessUnit);
        }

        query = ApplyTeamLeaderScope(query);

        var records = await query
            .OrderByDescending(k => k.CalculatedAtUtc)
            .ThenBy(k => k.Designation)
            .ToListAsync();

        return Ok(records.Select(MapToDto).ToList());
    }

    [HttpGet("records/{id:int}")]
    public async Task<IActionResult> GetRecordById(int id, [FromQuery] int? departmentId = null)
    {
        var query = _context.Set<Kpi>()
            .AsNoTracking()
            .Include(k => k.Project)
            .Include(k => k.Department)
            .Include(k => k.AddedByEmployee)
            .Where(k => k.Id == id);

        if (User.IsSuperAdmin())
        {
            if (departmentId.HasValue)
            {
                query = query.Where(k => k.DepartmentId == departmentId.Value);
            }
        }
        else
        {
            var targetDepartmentId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
            if (!targetDepartmentId.HasValue)
            {
                return Forbid();
            }

            query = query.Where(k => k.DepartmentId == targetDepartmentId.Value);
        }

        query = ApplyTeamLeaderScope(query);

        var kpi = await query.FirstOrDefaultAsync();

        return kpi == null ? NotFound() : Ok(MapToDto(kpi));
    }

    [HttpPost("records")]
    public async Task<IActionResult> CreateRecord([FromBody] AddKpiDto dto, [FromQuery] int? departmentId = null)
    {
        var targetDepartmentId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
        if (!targetDepartmentId.HasValue)
        {
            return Forbid();
        }

        var kpi = new Kpi { DepartmentId = targetDepartmentId.Value, CalculatedAtUtc = DateTime.UtcNow };
        ApplyDto(kpi, dto);

        if (User.TryGetEmployeeId(out var creatorEmployeeId))
        {
            kpi.AddedByEmployeeId = creatorEmployeeId;
        }

        _context.Set<Kpi>().Add(kpi);
        await _context.SaveChangesAsync();

        var created = await _context.Set<Kpi>()
            .AsNoTracking()
            .Include(k => k.Project)
            .Include(k => k.Department)
            .Include(k => k.AddedByEmployee)
            .FirstOrDefaultAsync(k => k.Id == kpi.Id);

        return Ok(MapToDto(created ?? kpi));
    }

    [HttpPut("records/{id:int}")]
    public async Task<IActionResult> UpdateRecord(int id, [FromBody] UpdateKpiDto dto, [FromQuery] int? departmentId = null)
    {
        var targetDepartmentId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
        if (!targetDepartmentId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Set<Kpi>().Where(k => k.Id == id && k.DepartmentId == targetDepartmentId.Value);
        query = ApplyTeamLeaderScope(query);

        var kpi = await query.FirstOrDefaultAsync();
        if (kpi == null)
        {
            return NotFound();
        }

        ApplyDto(kpi, dto);
        await _context.SaveChangesAsync();

        var updated = await _context.Set<Kpi>()
            .AsNoTracking()
            .Include(k => k.Project)
            .Include(k => k.Department)
            .Include(k => k.AddedByEmployee)
            .FirstOrDefaultAsync(k => k.Id == kpi.Id);

        return Ok(MapToDto(updated ?? kpi));
    }

    [HttpDelete("records/{id:int}")]
    public async Task<IActionResult> DeleteRecord(int id, [FromQuery] int? departmentId = null)
    {
        var targetDepartmentId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
        if (!targetDepartmentId.HasValue)
        {
            return Forbid();
        }

        var query = _context.Set<Kpi>().Where(k => k.Id == id && k.DepartmentId == targetDepartmentId.Value);
        query = ApplyTeamLeaderScope(query);

        var kpi = await query.FirstOrDefaultAsync();
        if (kpi == null)
        {
            return NotFound();
        }

        _context.Set<Kpi>().Remove(kpi);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

