namespace DashboardKpi.Application.Features.Authentication.DTOs;


public class TwoFactorSetupDto
{

    public string Secret {get;set;} = "";

    public string QrCode {get;set;} = "";

}