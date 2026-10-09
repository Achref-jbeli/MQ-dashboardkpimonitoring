using DashboardKpi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DashboardKpi.Infrastructure.Persistence.Configurations;


public class TwoFactorChallengeConfiguration 
    : IEntityTypeConfiguration<TwoFactorChallenge>
{

    public void Configure(
        EntityTypeBuilder<TwoFactorChallenge> builder)
    {

        builder.HasKey(x => x.Id);


        builder.Property(x=>x.Code)
            .HasMaxLength(6)
            .IsRequired();



        builder.HasOne(x=>x.Employee)
            .WithMany()
            .HasForeignKey(x=>x.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

    }

}