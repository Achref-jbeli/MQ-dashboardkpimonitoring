using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

namespace DashboardKpi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    public class PhotoController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        private static readonly string[] AllowedExtensions =
            { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

        // Whitelist of valid categories/subfolders. Add new features here.
        private static readonly HashSet<string> AllowedCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "international-business",
            "projects",
            "events",
            "vave",
            "maturity",
        };

        public PhotoController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpGet("list/{category}")]
        [AllowAnonymous]
        public IActionResult ListPhotos(string category)
        {
            if (!AllowedCategories.Contains(category))
                return BadRequest("Invalid category.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "uploads", category);

            if (!Directory.Exists(uploadsFolder))
                return Ok(new { urls = Array.Empty<string>() });

            var urls = Directory.GetFiles(uploadsFolder)
                .Where(f => AllowedExtensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
                .OrderByDescending(System.IO.File.GetCreationTimeUtc)
                .Select(f => $"/uploads/{category}/{Path.GetFileName(f)}")
                .ToArray();

            return Ok(new { urls });
        }

        [HttpPost("upload/{category}")]
        [RequestSizeLimit(MaxFileSizeBytes)]
        public async Task<IActionResult> UploadPhoto(string category, IFormFile file)
        {
            if (!AllowedCategories.Contains(category))
                return BadRequest("Invalid category.");

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (file.Length > MaxFileSizeBytes)
                return BadRequest("File exceeds the 5 MB limit.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return BadRequest("Invalid file type.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "uploads", category);
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/{category}/{fileName}";
            return Ok(new { url });
        }

        [HttpDelete("delete")]
        public IActionResult DeletePhoto([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return BadRequest("URL is required.");

            // Only allow deleting files we actually served under /uploads/{category}/...
            var decoded = Uri.UnescapeDataString(url).TrimStart('/');
            var segments = decoded.Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (segments.Length != 3 ||
                !segments[0].Equals("uploads", StringComparison.OrdinalIgnoreCase) ||
                !AllowedCategories.Contains(segments[1]))
            {
                return BadRequest("Invalid photo URL.");
            }

            var category = segments[1];
            var fileName = segments[2];

            // Guard against path traversal (../, etc.)
            if (fileName.Contains("..") || Path.GetFileName(fileName) != fileName)
                return BadRequest("Invalid file name.");

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(webRoot, "uploads", category, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            System.IO.File.Delete(filePath);
            return NoContent();
        }
    }
}