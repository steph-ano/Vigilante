using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public class CatalogScene
{
    public string Id { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public double CloudCover { get; set; }
    public double[]? Bbox { get; set; }
}

public interface ISentinelCatalogService
{
    Task<CatalogScene?> FindBestSceneAsync(
        BoundingBox bbox, 
        DateTime targetDate, 
        int maxCloudCoverage = 30, 
        int searchDaysWindow = 7, 
        CancellationToken cancellationToken = default);
}
