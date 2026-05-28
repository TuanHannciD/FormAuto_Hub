using FormAutoHub.Api.Data;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Integrations.AI;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

var allowedCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "https://*.trycloudflare.com",
        "https://*.servertun.pp.ua"
    ];


builder.Services.AddControllers();
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedCorsOrigins)
            .SetIsOriginAllowedToAllowWildcardSubdomains()
            .SetIsOriginAllowedToAllowWildcardSubdomains()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddDbContext<FormAutoHubDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure();
    }));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var authOptions = builder.Configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = authOptions.Issuer,
            ValidAudience = authOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, HttpCurrentUserContext>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IGoogleIdentityVerifier, GoogleIdentityVerifier>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPackageService, PackageService>();
builder.Services.AddScoped<ITopupOrderService, TopupOrderService>();
builder.Services.AddScoped<IAdminTopupOrderService, AdminTopupOrderService>();
builder.Services.AddScoped<ICreditService, CreditService>();
builder.Services.AddScoped<IUsageLogService, UsageLogService>();
builder.Services.AddScoped<ICreditTransactionService, CreditTransactionService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IPaymentSecretProtector, PaymentSecretProtector>();
builder.Services.AddScoped<IPaymentProviderSettingsService, PaymentProviderSettingsService>();
builder.Services.AddScoped<IAiProviderSecretProtector, AiProviderSecretProtector>();
builder.Services.AddScoped<IAiProviderSettingsService, AiProviderSettingsService>();
builder.Services.AddScoped<IPayosSignatureService, PayosSignatureService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IAdminPaymentReportService, AdminPaymentReportService>();
builder.Services.AddScoped<IFormProjectService, FormProjectService>();
builder.Services.AddScoped<IAnswerRuleService, AnswerRuleService>();
builder.Services.AddScoped<IResponseGenerationService, ResponseGenerationService>();
builder.Services.AddScoped<IAiPromptGuardService, AiPromptGuardService>();
builder.Services.AddScoped<IAiOutputValidator, AiOutputValidator>();
builder.Services.AddScoped<IAiPromptProfileService, AiPromptProfileService>();


var aiProviderAdapter = builder.Configuration["AI:ProviderAdapter"];
if (string.Equals(aiProviderAdapter, "Deterministic", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddScoped<IAiProviderAdapter, DeterministicAiProviderAdapter>();
}
else if (string.Equals(aiProviderAdapter, "OpenAICompatible", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHttpClient<IAiProviderAdapter, OpenAiCompatibleProviderAdapter>();
}
else
{
    builder.Services.AddScoped<IAiProviderAdapter, DisabledAiProviderAdapter>();
}
builder.Services.AddScoped<IAiGenerationService, AiGenerationService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();
builder.Services.AddHttpClient<IGoogleFormsClient, GoogleFormsClient>();
builder.Services.AddHttpClient<IPayosClient, PayosClient>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
