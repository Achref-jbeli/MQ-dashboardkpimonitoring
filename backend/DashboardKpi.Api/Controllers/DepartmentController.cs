using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using DashboardKpi.Application.Dtos.Department;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    public class DepartmentController : ControllerBase
    {
        private readonly ApplicationDbContext dbcontext;

        public DepartmentController(ApplicationDbContext dbcontext)
        {
            this.dbcontext = dbcontext;
        }

        private async Task<int?> ResolveDepartmentIdAsync()
            => await User.GetCurrentDepartmentIdAsync(dbcontext);

        [AllowAnonymous]
        [HttpGet("public-list")]
        public async Task<IActionResult> GetPublicDepartmentList()
        {
            var departments = await dbcontext.Departments
                .OrderBy(department => department.Name)
                .Select(department => new DepartmentDto
                {
                    Id = department.Id,
                    Name = department.Name
                })
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            if (User.IsSuperAdmin())
            {
                var allDepartments = await dbcontext.Departments
                    .OrderBy(department => department.Name)
                    .Select(department => new DepartmentDto { Id = department.Id, Name = department.Name })
                    .ToListAsync();
                return Ok(allDepartments);
            }

            var departmentId = await ResolveDepartmentIdAsync();
            if (!departmentId.HasValue)
            {
                return Forbid();
            }

            var departments = await dbcontext.Departments
                .Where(department => department.Id == departmentId.Value)
                .Select(department => new DepartmentDto { Id = department.Id, Name = department.Name })
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartmentById(int id)
        {
            if (User.IsSuperAdmin())
            {
                var superAdminDepartment = await dbcontext.Departments
                    .Where(department => department.Id == id)
                    .Select(department => new DepartmentDto { Id = department.Id, Name = department.Name })
                    .FirstOrDefaultAsync();
                if (superAdminDepartment == null)
                {
                    return NotFound();
                }

                return Ok(superAdminDepartment);
            }

            var departmentId = await ResolveDepartmentIdAsync();
            if (!departmentId.HasValue || departmentId.Value != id)
            {
                return Forbid();
            }

            var department = await dbcontext.Departments
                .Where(d => d.Id == id)
                .Select(d => new DepartmentDto { Id = d.Id, Name = d.Name })
                .FirstOrDefaultAsync();
            if (department == null)
            {
                return NotFound();
            }
            return Ok(department);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost]
        public async Task<IActionResult> CreateDepartment(AddDepartmentDto addDepartmentDto)
        {
            var department = new Department
            {
                Name = addDepartmentDto.Name,
                BusinessUnitId = addDepartmentDto.BusinessUnitId
            };

            dbcontext.Departments.Add(department);
            await dbcontext.SaveChangesAsync();
            return Ok(department);
        }
        
    }
}