using System.Collections.Generic;

namespace DashboardKpi.Application.Dtos.InternationalBusiness;

public class AddInternationalBusinessDto
{
    public string? Name { get; set; }
    public string? Country { get; set; }
    public string? PartnerName { get; set; }
    public string? Description { get; set; }
    public List<string>? Photos { get; set; }

    public bool IsPublicActive { get; set; } = true;
    public bool IsNewBusiness { get; set; } = false;

    public string? ProjectInfo { get; set; }
    public string? VolumeLifetime { get; set; }
    public string? SalesLifetime { get; set; }
    public string? Sop { get; set; }
    public string? ProductionLocation { get; set; }
}