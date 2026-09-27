using Vigilante.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Vigilante - Sentinel-2 Disaster Monitor API",
        Version = "v1",
        Description = "API proxy autenticada para Copernicus Data Space Ecosystem (CDSE) / Sentinel Hub Process & Catalog API."
    });
});

// Infrastructure
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// Domain Services
builder.Services.AddSingleton<ICdseAuthService, CdseAuthService>();
builder.Services.AddSingleton<ISentinelCatalogService, SentinelCatalogService>();
builder.Services.AddSingleton<ISentinelProcessService, SentinelProcessService>();
builder.Services.AddSingleton<ISimulatedSatelliteService, SimulatedSatelliteService>();
builder.Services.AddSingleton<IImageCacheService, ImageCacheService>();
builder.Services.AddSingleton<IDisasterPresetService, DisasterPresetService>();
builder.Services.AddScoped<IDisasterCompareService, DisasterCompareService>();

// CORS for Angular client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vigilante API v1");
    });
}

app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();
