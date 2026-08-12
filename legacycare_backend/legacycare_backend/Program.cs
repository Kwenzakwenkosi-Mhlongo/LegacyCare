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
using PolicyManagement.Service.TaskManagement;
using PolicyManagement.Service.UserManagement;
using PolicyManagement.Services;
using PolicyManagement.Services.ScheduleManagement;
using System.Text;
using QuestPDF.Infrastructure;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using PolicyManagement.Models.UserManagement;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    EnvironmentName = Environments.Production
});

builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: false)
    .AddEnvironmentVariables();



QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 64;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"] ?? builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-here-min-32-characters-long");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? builder.Configuration["Jwt:Issuer"],
        ValidAudience = jwtSettings["Audience"] ?? builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

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

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
// HTTPS is handled by Render
app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.MapStaticAssets();
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();