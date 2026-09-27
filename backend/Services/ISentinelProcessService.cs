using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public interface ISentinelProcessService
{
    Task<ImageResult?> FetchSatelliteImageAsync(
        BoundingBox bbox,
        DateTime dateFrom,
        DateTime dateTo,
        string visualizationMode,
        int width = 800,
        int height = 800,
        int maxCloudCoverage = 30,
        CancellationToken cancellationToken = default);

    string GetEvalscript(string visualizationMode);
}
