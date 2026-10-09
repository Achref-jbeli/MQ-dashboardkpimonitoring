using Microsoft.AspNetCore.Mvc;
using DashboardKpi.Infrastructure.Data;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Application.Dtos.Employee;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    public class EmployeeController : ControllerBase
    {
        private readonly ApplicationDbContext dbcontext;

        public EmployeeController(ApplicationDbContext dbcontext)
        {
            this.dbcontext = dbcontext;
        }

        private static EmployeeDto MapToDto(Employee e)
        {
            return new EmployeeDto
            {
                Id = e.Id,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Position = e.Position,
                Role = e.Role ?? "Employee",
                DepartmentId = e.DepartmentId,
                DepartmentName = e.DepartmentEntity?.Name ?? e.Department,
                TeamId = e.TeamId,
                TeamName = e.Team?.Name,
                ProfessionalDomain = e.ProfessionalDomain,
                Seniority = e.Seniority,
                BirthDate = e.BirthDate,
                HireDate = e.HireDate,
                IsActive = e.IsActive,
                Photo = e.Photo
            };
        }

        private async Task<int?> ResolveDepartmentIdAsync(int? requestedDepartmentId = null, bool allowGlobalForSuperAdmin = false)
        {
            if (allowGlobalForSuperAdmin && User.IsSuperAdmin() && !requestedDepartmentId.HasValue)
            {
                return null;
            }

            return await User.ResolveDepartmentScopeAsync(dbcontext, requestedDepartmentId);
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees([FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Employees
                .Include(e => e.DepartmentEntity)
                .Include(e => e.Team)
                .AsQueryable();

            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(employee => employee.DepartmentId == resolvedDepartmentId.Value);
            }

            var employees = await query
                .OrderBy(e => e.FirstName)
                .ThenBy(e => e.LastName)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    Email = e.Email,
                    Position = e.Position,
                    Role = e.Role ?? "Employee",
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.DepartmentEntity != null ? e.DepartmentEntity.Name : e.Department,
                    TeamId = e.TeamId,
                    TeamName = e.Team != null ? e.Team.Name : null,
                    ProfessionalDomain = e.ProfessionalDomain,
                    Seniority = e.Seniority,
                    BirthDate = e.BirthDate,
                    HireDate = e.HireDate,
                    IsActive = e.IsActive,
                    Photo = e.Photo
                })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployeeById(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Employees
                .Include(e => e.DepartmentEntity)
                .Include(e => e.Team)
                .Where(e => e.Id == id);

            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(e => e.DepartmentId == resolvedDepartmentId.Value);
            }

            var employee = await query.FirstOrDefaultAsync();
            if (employee == null)
            {
                return NotFound();
            }
            return Ok(MapToDto(employee));
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee(AddEmployeeDto addEmployeeDto)
        {
            if (string.IsNullOrWhiteSpace(addEmployeeDto.FirstName) || string.IsNullOrWhiteSpace(addEmployeeDto.LastName))
            {
                return BadRequest(new { message = "Full name (First Name and Last Name) is required." });
            }

            if (string.IsNullOrWhiteSpace(addEmployeeDto.Email))
            {
                return BadRequest(new { message = "Email address is required." });
            }

            var requestedRole = !string.IsNullOrWhiteSpace(addEmployeeDto.Role) ? addEmployeeDto.Role.Trim() : "Employee";
            if (string.Equals(requestedRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Assigning the SuperAdmin role via the employee form is restricted." });
            }

            var departmentId = await ResolveDepartmentIdAsync(addEmployeeDto.DepartmentId);
            if (!departmentId.HasValue)
            {
                return Forbid();
            }

            var departmentName = await dbcontext.Departments
                .Where(item => item.Id == departmentId.Value)
                .Select(item => item.Name)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(departmentName))
            {
                return BadRequest(new { message = "Selected department does not exist." });
            }

            // Validate Team belongs to Department
            if (addEmployeeDto.TeamId.HasValue && addEmployeeDto.TeamId.Value > 0)
            {
                var team = await dbcontext.Teams.FirstOrDefaultAsync(t => t.Id == addEmployeeDto.TeamId.Value);
                if (team == null || team.DepartmentId != departmentId.Value)
                {
                    return BadRequest(new { message = "Selected team does not belong to the selected department." });
                }
            }

            var positionValue = !string.IsNullOrWhiteSpace(addEmployeeDto.Position)
                ? addEmployeeDto.Position.Trim()
                : requestedRole;

            var employeeEntity = new Employee
            {
                FirstName = addEmployeeDto.FirstName.Trim(),
                LastName = addEmployeeDto.LastName.Trim(),
                Email = addEmployeeDto.Email.Trim(),
                Position = positionValue,
                Role = requestedRole,
                ProfessionalDomain = addEmployeeDto.ProfessionalDomain,
                Seniority = addEmployeeDto.Seniority,
                BirthDate = addEmployeeDto.BirthDate,
                IsActive = addEmployeeDto.IsActive,
                HireDate = addEmployeeDto.HireDate,
                Department = departmentName,
                DepartmentId = departmentId.Value,
                TeamId = addEmployeeDto.TeamId > 0 ? addEmployeeDto.TeamId : null,
                Photo = addEmployeeDto.Photo,
                IsAccountApproved = false,
                TwoFactorEnabled = false
            };

            dbcontext.Employees.Add(employeeEntity);
            await dbcontext.SaveChangesAsync();

            var created = await dbcontext.Employees
                .Include(e => e.DepartmentEntity)
                .Include(e => e.Team)
                .FirstOrDefaultAsync(e => e.Id == employeeEntity.Id);

            return Ok(MapToDto(created ?? employeeEntity));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, UpdateEmployeeDto updateEmployeeDto, [FromQuery] int? departmentId)
        {
            var sourceDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!sourceDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Employees
                .Include(e => e.DepartmentEntity)
                .Include(e => e.Team)
                .Where(item => item.Id == id);

            if (sourceDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == sourceDepartmentId.Value || item.DepartmentId == null);
            }

            var employee = await query.FirstOrDefaultAsync();
            if (employee == null)
            {
                return NotFound();
            }

            var resolvedTargetDepartmentId = await ResolveDepartmentIdAsync(updateEmployeeDto.DepartmentId ?? departmentId ?? employee.DepartmentId);
            if (!resolvedTargetDepartmentId.HasValue)
            {
                return BadRequest(new { message = "DepartmentId is required." });
            }

            var departmentName = await dbcontext.Departments
                .Where(item => item.Id == resolvedTargetDepartmentId.Value)
                .Select(item => item.Name)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(departmentName))
            {
                return BadRequest(new { message = "Selected department does not exist." });
            }

            // Validate team belongs to department
            if (updateEmployeeDto.TeamId.HasValue)
            {
                if (updateEmployeeDto.TeamId.Value > 0)
                {
                    var team = await dbcontext.Teams.FirstOrDefaultAsync(t => t.Id == updateEmployeeDto.TeamId.Value);
                    if (team == null || team.DepartmentId != resolvedTargetDepartmentId.Value)
                    {
                        return BadRequest(new { message = "Selected team does not belong to the selected department." });
                    }
                    employee.TeamId = updateEmployeeDto.TeamId.Value;
                }
                else
                {
                    employee.TeamId = null;
                }
            }
            else if (updateEmployeeDto.DepartmentId.HasValue && updateEmployeeDto.DepartmentId.Value != employee.DepartmentId)
            {
                // Department changed - check if current team still belongs to new department
                if (employee.TeamId.HasValue)
                {
                    var currentTeam = await dbcontext.Teams.FirstOrDefaultAsync(t => t.Id == employee.TeamId.Value);
                    if (currentTeam == null || currentTeam.DepartmentId != resolvedTargetDepartmentId.Value)
                    {
                        employee.TeamId = null;
                    }
                }
            }

            if (updateEmployeeDto.Role != null && string.Equals(updateEmployeeDto.Role.Trim(), "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Assigning the SuperAdmin role via the employee form is restricted." });
            }

            if (updateEmployeeDto.FirstName != null && !string.IsNullOrWhiteSpace(updateEmployeeDto.FirstName))
                employee.FirstName = updateEmployeeDto.FirstName.Trim();

            if (updateEmployeeDto.LastName != null && !string.IsNullOrWhiteSpace(updateEmployeeDto.LastName))
                employee.LastName = updateEmployeeDto.LastName.Trim();

            if (updateEmployeeDto.ProfessionalDomain != null)
                employee.ProfessionalDomain = updateEmployeeDto.ProfessionalDomain;

            if (updateEmployeeDto.Seniority != null)
                employee.Seniority = updateEmployeeDto.Seniority;

            if (updateEmployeeDto.Position != null)
                employee.Position = updateEmployeeDto.Position;

            if (updateEmployeeDto.Role != null && !string.IsNullOrWhiteSpace(updateEmployeeDto.Role))
                employee.Role = updateEmployeeDto.Role.Trim();

            employee.IsActive = updateEmployeeDto.IsActive;

            if (updateEmployeeDto.HireDate.HasValue)
                employee.HireDate = updateEmployeeDto.HireDate.Value;

            if (updateEmployeeDto.BirthDate.HasValue)
                employee.BirthDate = updateEmployeeDto.BirthDate.Value;

            employee.Department = departmentName;
            employee.DepartmentId = resolvedTargetDepartmentId.Value;

            if (updateEmployeeDto.Photo != null)
                employee.Photo = updateEmployeeDto.Photo;

            if (updateEmployeeDto.Email != null)
                employee.Email = updateEmployeeDto.Email;

            await dbcontext.SaveChangesAsync();

            var updated = await dbcontext.Employees
                .Include(e => e.DepartmentEntity)
                .Include(e => e.Team)
                .FirstOrDefaultAsync(e => e.Id == employee.Id);

            return Ok(MapToDto(updated ?? employee));
        }

        [Authorize(Roles = "Administrator,SuperAdmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Employees.Where(item => item.Id == id);
            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == resolvedDepartmentId.Value);
            }

            var employee = await query.FirstOrDefaultAsync();
            if (employee == null)
            {
                return NotFound();
            }
            dbcontext.Employees.Remove(employee);
            await dbcontext.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("upload-photo")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadEmployeePhoto(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No image was uploaded." });
            }

            if (!file.ContentType.StartsWith("image/"))
            {
                return BadRequest(new { message = "Only image files are allowed." });
            }

            var uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "uploads",
                "employees"
            );

            Directory.CreateDirectory(uploadsFolder);

            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var photoUrl = $"/uploads/employees/{fileName}";
            return Ok(new { url = photoUrl });
        }
    }
}