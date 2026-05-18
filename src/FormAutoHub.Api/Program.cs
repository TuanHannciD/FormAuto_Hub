using FormAutoHub.Api.Data;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using Microsoft.EntityFrameworkCore;

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
        "http://127.0.0.1:5173"
    ];

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedCorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddDbContext<FormAutoHubDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure();
    }));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, HeaderCurrentUserContext>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPackageService, PackageService>();
builder.Services.AddScoped<ITopupOrderService, TopupOrderService>();
builder.Services.AddScoped<IAdminTopupOrderService, AdminTopupOrderService>();
builder.Services.AddScoped<ICreditService, CreditService>();
builder.Services.AddScoped<IUsageLogService, UsageLogService>();
builder.Services.AddScoped<ICreditTransactionService, CreditTransactionService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IFormProjectService, FormProjectService>();
builder.Services.AddScoped<IAnswerRuleService, AnswerRuleService>();
builder.Services.AddScoped<IResponseGenerationService, ResponseGenerationService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();
builder.Services.AddHttpClient<IGoogleFormsClient, GoogleFormsClient>();

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

app.UseAuthorization();

app.MapControllers();

app.Run();
