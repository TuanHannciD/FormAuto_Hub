using FormAutoHub.Api.Configuration;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FormAutoHub.Tests;

public sealed class DataProtectionPersistenceTests
{
    [Fact]
    public void PersistedKeyRing_UnprotectsPayloadAcrossServiceProviders()
    {
        var keysPath = Path.Combine(Path.GetTempPath(), $"formautohub-data-protection-{Guid.NewGuid():N}");

        try
        {
            var protectedValue = ProtectWithNewServiceProvider(keysPath, "provider-secret");
            var unprotectedValue = UnprotectWithNewServiceProvider(keysPath, protectedValue);

            Assert.Equal("provider-secret", unprotectedValue);
            Assert.NotEmpty(Directory.GetFiles(keysPath, "key-*.xml"));
        }
        finally
        {
            if (Directory.Exists(keysPath))
            {
                Directory.Delete(keysPath, recursive: true);
            }
        }
    }

    private static string ProtectWithNewServiceProvider(string keysPath, string value)
    {
        using var serviceProvider = BuildServiceProvider(keysPath);
        var protector = serviceProvider
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("FormAutoHub.Tests.ProviderSecret");

        return protector.Protect(value);
    }

    private static string UnprotectWithNewServiceProvider(string keysPath, string value)
    {
        using var serviceProvider = BuildServiceProvider(keysPath);
        var protector = serviceProvider
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("FormAutoHub.Tests.ProviderSecret");

        return protector.Unprotect(value);
    }

    private static ServiceProvider BuildServiceProvider(string keysPath)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DataProtection:KeysPath"] = keysPath
            })
            .Build();
        var services = new ServiceCollection();
        services.AddFormAutoHubDataProtection(configuration);

        return services.BuildServiceProvider();
    }
}
