using System.Reflection;
using FormAutoHub.Api.Controllers.Nckh;
using Microsoft.AspNetCore.Authorization;

namespace FormAutoHub.Tests;

public sealed class NckhAdminAuthorizationTests
{
    public static IEnumerable<object[]> NckhControllers()
    {
        return typeof(ResearchFormsController).Assembly
            .GetTypes()
            .Where(type => type.Namespace == typeof(ResearchFormsController).Namespace)
            .Where(type => type.IsClass && !type.IsAbstract && typeof(Microsoft.AspNetCore.Mvc.ControllerBase).IsAssignableFrom(type))
            .Select(type => new object[] { type });
    }

    [Theory]
    [MemberData(nameof(NckhControllers))]
    public void EveryNckhControllerRequiresAdminRole(Type controllerType)
    {
        var authorization = controllerType.GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorization);
        Assert.Equal("Admin", authorization!.Roles);
    }
}
