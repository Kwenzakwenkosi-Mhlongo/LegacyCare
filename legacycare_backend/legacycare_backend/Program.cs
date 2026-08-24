using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PolicyManagement.Data;
using PolicyManagement.Service.JWT;
using PolicyManagement.Service.MortuaryManagement;
using PolicyManagement.Service.PackageManagement;
using PolicyManagement.Service.PaymentManagement;
using PolicyManagement.Service.PolicyManagement;
using PolicyManagement.Service.ScheduleManagement;
using PolicyManagement.Service.ServiceRequestManagement;
using PolicyManagement.Service.TaskManagement;
using PolicyManagement.Service.UserManagement;
using PolicyManagement.Services;
using PolicyManagement.Services.ScheduleManagement;
using PolicyManagement.Service.DashboardManagement;
using PolicyManagement.Models.UserManagement;
using Microsoft.AspNetCore.Identity;
using QuestPDF.Infrastructure;
using System.Text;
using System.Text.Json.Serialization;

Environment.SetEnvironmentVariable(
    "DOTNET_USE_POLLING_FILE_WATCHER",
    "1"
);

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// CONFIGURATION
// =====================================================

builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile(
        "appsettings.json",
        optional: false,
        reloadOnChange: false
    )
    .AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: false
    )
    .AddEnvironmentVariables();


// =====================================================
// QUESTPDF
// =====================================================

QuestPDF.Settings.License = LicenseType.Community;


// =====================================================
// CONTROLLERS + JSON
// =====================================================

builder.Services
    .AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            ReferenceHandler.IgnoreCycles;

        options.JsonSerializerOptions.MaxDepth = 64;

        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()
        );
    });


// =====================================================
// SWAGGER
// =====================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    // JWT Bearer authentication
    options.AddSecurityDefinition(
        "Bearer",
        new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.ParameterLocation.Header,
            Description =
                "Enter your JWT token. Do not include the word 'Bearer'."
        }
    );

    // Tell Swagger that endpoints can use JWT authentication
    options.AddSecurityRequirement(document =>
        new Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [
                new Microsoft.OpenApi.OpenApiSecuritySchemeReference(
                    "Bearer",
                    document
                )
            ] = new List<string>()
        }
    );
});


// =====================================================
// JWT SETTINGS
// =====================================================

var jwtSettings =
    builder.Configuration.GetSection("JwtSettings");

var secret =
    jwtSettings["Secret"]
    ?? builder.Configuration["Jwt:Key"]
    ?? "your-super-secret-key-here-min-32-characters-long";

var key = Encoding.UTF8.GetBytes(secret);


// =====================================================
// AUTHENTICATION
// =====================================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    jwtSettings["Issuer"]
                    ?? builder.Configuration["Jwt:Issuer"],

                ValidAudience =
                    jwtSettings["Audience"]
                    ?? builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(key),

                ClockSkew = TimeSpan.Zero
            };
    });


// =====================================================
// AUTHORIZATION
// =====================================================

builder.Services.AddAuthorization();


// =====================================================
// APPLICATION SERVICES
// =====================================================

builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<IPasswordService, PasswordService>();

builder.Services.AddScoped<IBookingRestrictionService, BookingRestrictionService>();

builder.Services.AddScoped<IPolicyService, PolicyService>();

builder.Services.AddScoped<IPackageService, PackageService>();

builder.Services.AddScoped<IBeneficiaryService, BeneficiaryService>();

builder.Services.AddScoped<IBeneficiaryRequestService, BeneficiaryRequestService>();

builder.Services.AddScoped<IPackageChangeRequestService, PackageChangeRequestService>();

builder.Services.AddScoped<IStorageService, StorageService>();

builder.Services.AddScoped<IDeceasedService, DeceasedService>();

builder.Services.AddScoped<IDeceasedStorageService, DeceasedStorageService>();

builder.Services.AddScoped<IEventService, EventService>();

builder.Services.AddScoped<ITaskService, TaskService>();

builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();

builder.Services.AddScoped<IInvoiceService, InvoiceService>();

builder.Services.AddScoped<JwtService>();

builder.Services.AddScoped<AuthenticationService>();

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddScoped<IClientService, ClientService>();

builder.Services.AddScoped<IStaffService, StaffService>();

builder.Services.AddScoped<IClientValidationService, ClientValidationService>();

builder.Services.AddScoped<IStaffValidationService, StaffValidationService>();

builder.Services.AddScoped<
    IFuneralRequestService,
    FuneralRequestService>();

builder.Services.AddScoped<
    IDeathNotificationService,
    DeathNotificationService>();

    builder.Services.AddScoped<
    IFuneralStaffDeploymentService,
    FuneralStaffDeploymentService>();

// -----------------------------------------------------
// Previously missing registration.
// Without this, DI cannot construct ServiceRequestController,
// causing every /api/ServiceRequest/* route to fail with a 500
// ("Unable to resolve service for type IServiceRequestService").
// -----------------------------------------------------
builder.Services.AddScoped<
    IServiceRequestService,
    ServiceRequestService>();


// =====================================================
// DASHBOARD SERVICE
// =====================================================

builder.Services.AddScoped<IDashboardService, DashboardService>();


// =====================================================
// EMAIL SERVICE
// =====================================================

builder.Services.AddHttpClient<IEmailService, EmailService>();


// =====================================================
// DATABASE
// =====================================================

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString =
        builder.Configuration.GetConnectionString(
            "DefaultConnection"
        );

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "DefaultConnection was not found."
        );
    }

    options.UseSqlServer(
        connectionString,
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null
            );
        }
    );
});


// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "https://legacycare-frontend5-d9d7dzd8afducjcr.southafricanorth-01.azurewebsites.net"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});


// =====================================================
// BUILD APP
// =====================================================

var app = builder.Build();


// =====================================================
// ENVIRONMENT
// =====================================================

Console.WriteLine(
    $"[DIAGNOSTIC] EnvironmentName = '{app.Environment.EnvironmentName}'"
);


// =====================================================
// ERROR HANDLING
// =====================================================

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var exceptionHandler =
                context.Features.Get<
                    Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature
                >();

            var logger =
                context.RequestServices
                    .GetRequiredService<ILogger<Program>>();

            if (exceptionHandler?.Error != null)
            {
                logger.LogError(
                    exceptionHandler.Error,
                    "Unhandled exception while processing {Method} {Path}",
                    context.Request.Method,
                    context.Request.Path
                );
            }

            context.Response.StatusCode = 500;

            context.Response.ContentType =
                "application/json";

            await context.Response.WriteAsJsonAsync(
                new
                {
                    message = "Internal server error",
                    path = context.Request.Path
                }
            );
        });
    });

    app.UseHsts();
}
else
{
    // =================================================
    // SWAGGER
    // =================================================

    app.UseSwagger();

    app.UseSwaggerUI();
}


// =====================================================
// HTTPS
// =====================================================

// HTTPS is handled by hosting environment
// app.UseHttpsRedirection();


// =====================================================
// HTTP PIPELINE
// =====================================================

app.UseRouting();


// =====================================================
// CORS
// =====================================================

app.UseCors("AllowFrontend");


// =====================================================
// AUTHENTICATION
// =====================================================

app.UseAuthentication();


// =====================================================
// AUTHORIZATION
// =====================================================

app.UseAuthorization();


// =====================================================
// STATIC FILES
// =====================================================

app.MapStaticAssets();


// =====================================================
// CONTROLLERS
// =====================================================

app.MapControllers();


// =====================================================
// MVC ROUTING
// =====================================================

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
)
.WithStaticAssets();


// =====================================================
// START APPLICATION
// =====================================================

app.Run();