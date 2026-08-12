using Microsoft.AspNetCore.DataProtection;

namespace FormAutoHub.Api.Configuration;

public static class DataProtectionServiceCollectionExtensions
{
    public static IServiceCollection AddFormAutoHubDataProtection(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var dataProtection = services.AddDataProtection();

        var keysPath = configuration["DataProtection:KeysPath"];
        if (!string.IsNullOrWhiteSpace(keysPath))
        {
            Directory.CreateDirectory(keysPath);
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        }

        return services;
    }
}
