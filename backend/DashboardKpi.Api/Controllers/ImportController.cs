using DashboardKpi.Api.Extensions;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
public class ImportController : ControllerBase
{
	private readonly IExternalApiPipelineService _pipelineService;
	private readonly IKpiImportService _importService;
	private readonly ApplicationDbContext _context;
	private readonly ILogger<ImportController> _logger;

	public ImportController(
		IExternalApiPipelineService pipelineService,
		IKpiImportService importService,
		ApplicationDbContext context,
		ILogger<ImportController> logger)
	{
		_pipelineService = pipelineService;
		_importService = importService;
		_context = context;
		_logger = logger;
	}

	private async Task<int?> ResolveDepartmentIdAsync(int? requestedDepartmentId = null)
		=> await User.ResolveDepartmentScopeAsync(_context, requestedDepartmentId);

	[HttpPost("apis/extraction")]
	public async Task<IActionResult> CreateExtractionApi([FromBody] AddDataExtractionApiDto dto, [FromQuery] int? departmentId = null)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		try
		{
			var created = await _pipelineService.CreateExtractionApiAsync(targetDepartmentId.Value, dto);
			return Ok(created);
		}
		catch (InvalidOperationException exception)
		{
			return BadRequest(new { message = exception.Message });
		}
	}

	[HttpPost("apis/processing")]
	public async Task<IActionResult> CreateProcessingApi([FromBody] AddDataProcessingApiDto dto, [FromQuery] int? departmentId = null)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		try
		{
			var created = await _pipelineService.CreateProcessingApiAsync(targetDepartmentId.Value, dto);
			return Ok(created);
		}
		catch (InvalidOperationException exception)
		{
			return BadRequest(new { message = exception.Message });
		}
	}

	[HttpPost("apis/calculation")]
	public async Task<IActionResult> CreateCalculationApi([FromBody] AddDataCalculationApiDto dto, [FromQuery] int? departmentId = null)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		try
		{
			var created = await _pipelineService.CreateCalculationApiAsync(targetDepartmentId.Value, dto);
			return Ok(created);
		}
		catch (InvalidOperationException exception)
		{
			return BadRequest(new { message = exception.Message });
		}
	}

	[HttpGet("apis/project/{projectId:int}")]
	public async Task<IActionResult> GetProjectApis(int projectId, [FromQuery] int? departmentId = null)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		try
		{
			var apis = await _pipelineService.GetProjectApisAsync(targetDepartmentId.Value, projectId);
			return Ok(apis);
		}
		catch (InvalidOperationException exception)
		{
			return BadRequest(new { message = exception.Message });
		}
	}

	[HttpGet("kpis")]
	public async Task<IActionResult> GetDepartmentKpis([FromQuery] int? departmentId, [FromQuery] int? projectId, [FromQuery] string? businessUnit)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		var query = _context.Set<Kpi>()
			.AsNoTracking()
			.Include(k => k.Project)
			.Where(k => k.DepartmentId == targetDepartmentId.Value);

		if (projectId.HasValue)
		{
			query = query.Where(k => k.ProjectId == projectId.Value);
		}

		if (!string.IsNullOrWhiteSpace(businessUnit))
		{
			query = query.Where(k => k.BusinessUnit == businessUnit);
		}

		if (User.IsInRole("TeamLeader") && !User.IsInRole("Administrator") && !User.IsInRole("SuperAdmin") && !User.IsInRole("Manager")
			&& User.TryGetEmployeeId(out var teamLeaderEmployeeId))
		{
			query = query.Where(k =>
				k.AddedByEmployeeId == teamLeaderEmployeeId ||
				(k.ProjectId != null && k.Project!.TeamLeaderId == teamLeaderEmployeeId));
		}

		var list = await query
			.OrderByDescending(k => k.CalculatedAtUtc)
			.ThenBy(k => k.Designation)
			.Select(k => new
			{
				k.Id,
				Designation = k.Designation ?? "Untitled KPI",
				k.CalculatedValue,
				k.AdherenceToSchedule,
				k.Green,
				k.Yellow,
				k.Orange,
				k.Red,
				k.ProjectId,
				ProjectTitle = k.Project != null ? k.Project.Title : null,
				k.BusinessUnit,
				k.SourceType,
				k.SourceIdentifier,
				k.WorkItem,
				k.Month,
				k.Formula,
				k.CalculatedAtUtc,
			})
			.ToListAsync();

		return Ok(list);
	}

	[HttpPost("kpis/csv")]
	[RequestSizeLimit(50_000_000)]
	public async Task<IActionResult> ImportProjectKpisFromCsv([FromForm] int? projectId, [FromForm] string? performanceUnit, [FromForm] string? businessUnit, [FromForm] int? extractionApiId, [FromQuery] int? departmentId, IFormFile file)
		=> await ImportProjectKpisFromFile(projectId, performanceUnit, businessUnit, extractionApiId, departmentId, file);

	[HttpPost("kpis/file")]
	[RequestSizeLimit(50_000_000)]
	public async Task<IActionResult> ImportProjectKpisFromFile([FromForm] int? projectId, [FromForm] string? performanceUnit, [FromForm] string? businessUnit, [FromForm] int? extractionApiId, [FromQuery] int? departmentId, IFormFile file)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		if (file == null || file.Length == 0)
		{
			return BadRequest(new ProblemDetails
			{
				Title = "Missing Import File",
				Status = StatusCodes.Status400BadRequest,
				Detail = "An import file is required (.csv, .xlsx, or .xlsm)."
			});
		}

		_logger.LogInformation(
			"Starting KPI file import. DepartmentId: {DeptId}, ProjectId: {ProjId}, FileName: {FileName}, FileSize: {Size} bytes",
			targetDepartmentId.Value, projectId, file.FileName, file.Length);

		try
		{
			await using var stream = file.OpenReadStream();
			var dto = new ImportProjectKpiCsvDto
			{
				ProjectId = projectId,
				PerformanceUnit = performanceUnit,
				BusinessUnit = businessUnit,
				ExtractionApiId = extractionApiId,
			};

			var result = await _importService.ImportFromFileAsync(targetDepartmentId.Value, dto, stream, file.FileName);

			if (!result.Success && result.Errors.Count > 0 && result.ImportedCount == 0)
			{
				_logger.LogWarning("KPI import completed with validation failure: {ErrorCount} errors.", result.Errors.Count);
				return BadRequest(new
				{
					title = "KPI Import Validation Failed",
					status = 400,
					detail = result.Errors.FirstOrDefault()?.Message ?? "Validation failed for all rows in the file.",
					errors = result.Errors,
					traceId = HttpContext.TraceIdentifier
				});
			}

			_logger.LogInformation("KPI import succeeded. BatchId: {BatchId}, Imported: {Imported}, Updated: {Updated}",
				result.BatchId, result.ImportedCount, result.UpdatedCount);

			return Ok(result);
		}
		catch (InvalidOperationException exception)
		{
			_logger.LogWarning(exception, "KPI import validation error: {Message}", exception.Message);
			return BadRequest(new ProblemDetails
			{
				Title = "Invalid Import Operation",
				Status = StatusCodes.Status400BadRequest,
				Detail = exception.Message,
				Instance = HttpContext.TraceIdentifier
			});
		}
		catch (Exception exception)
		{
			_logger.LogError(exception, "Unhandled error during KPI file import: {Message}", exception.Message);
			return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
			{
				Title = "KPI Import Processing Error",
				Status = StatusCodes.Status500InternalServerError,
				Detail = exception.Message,
				Instance = HttpContext.TraceIdentifier
			});
		}
	}

	[HttpPost("kpis/jira")]
	public async Task<IActionResult> ImportProjectKpisFromJira([FromBody] ImportProjectKpiJiraDto dto, [FromQuery] int? departmentId = null)
	{
		var targetDepartmentId = await ResolveDepartmentIdAsync(departmentId);
		if (!targetDepartmentId.HasValue)
		{
			return Forbid();
		}

		_logger.LogInformation("Starting Jira KPI import. DepartmentId: {DeptId}, ProjectId: {ProjId}, ExtractionApiId: {ApiId}",
			targetDepartmentId.Value, dto.ProjectId, dto.ExtractionApiId);

		try
		{
			var result = await _importService.ImportFromJiraAsync(targetDepartmentId.Value, dto);

			if (!result.Success && result.Errors.Count > 0 && result.ImportedCount == 0)
			{
				return BadRequest(new
				{
					title = "Jira Import Failed",
					status = 400,
					detail = result.Errors.FirstOrDefault()?.Message ?? "Failed to extract Jira issues.",
					errors = result.Errors,
					traceId = HttpContext.TraceIdentifier
				});
			}

			return Ok(result);
		}
		catch (InvalidOperationException exception)
		{
			return BadRequest(new ProblemDetails
			{
				Title = "Invalid Jira Import Operation",
				Status = StatusCodes.Status400BadRequest,
				Detail = exception.Message,
				Instance = HttpContext.TraceIdentifier
			});
		}
		catch (HttpRequestException exception)
		{
			return BadRequest(new ProblemDetails
			{
				Title = "Jira API Connection Error",
				Status = StatusCodes.Status400BadRequest,
				Detail = $"Failed to fetch Jira data: {exception.Message}",
				Instance = HttpContext.TraceIdentifier
			});
		}
		catch (Exception exception)
		{
			_logger.LogError(exception, "Unhandled error during Jira import: {Message}", exception.Message);
			return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
			{
				Title = "Jira Import Processing Error",
				Status = StatusCodes.Status500InternalServerError,
				Detail = exception.Message,
				Instance = HttpContext.TraceIdentifier
			});
		}
	}
}
