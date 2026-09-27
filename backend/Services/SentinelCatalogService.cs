using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public class SentinelCatalogService : ISentinelCatalogService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ICdseAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SentinelCatalogService> _logger;

    public SentinelCatalogService(
        IHttpClientFactory httpClientFactory,
        ICdseAuthService authService,
        IConfiguration configuration,
        ILogger<SentinelCatalogService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _authService = authService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<CatalogScene?> FindBestSceneAsync(
        BoundingBox bbox, 
        DateTime targetDate, 
        int maxCloudCoverage = 30, 
        int searchDaysWindow = 12, 
        CancellationToken cancellationToken = default)
    {
        var token = await _authService.GetAccessTokenAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("No CDSE token available for Catalog search.");
            return null;
        }

        var apiBase = _configuration["Copernicus:ApiBaseUrl"] ?? "https://sh.dataspace.copernicus.eu";
        var catalogEndpoint = $"{apiBase.TrimEnd('/')}/api/v1/catalog/1.0.0/search";

        var dateFrom = targetDate.AddDays(-searchDaysWindow).ToString("yyyy-MM-ddTHH:mm:ssZ");
        var dateTo = targetDate.AddDays(searchDaysWindow).ToString("yyyy-MM-ddTHH:mm:ssZ");

        // Payload compatible with Copernicus Data Space STAC / Sentinel Hub Catalog 1.0.0
        var payload = new
        {
            collections = new[] { "sentinel-2-l2a" },
            datetime = $"{dateFrom}/{dateTo}",
            bbox = bbox.ToArray(),
            limit = 25
        };

        try
        {
            var client = _httpClientFactory.CreateClient("SentinelCatalog");
            using var request = new HttpRequestMessage(HttpMethod.Post, catalogEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Catalog search returned status {Status}: {Error}", response.StatusCode, errorText);
                return null;
            }

            var jsonStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var root = await JsonNode.ParseAsync(jsonStream, cancellationToken: cancellationToken);

            var features = root?["features"]?.AsArray();
            if (features == null || features.Count == 0)
            {
                _logger.LogInformation("No scenes found in Catalog for window {From} to {To}", dateFrom, dateTo);
                return null;
            }

            CatalogScene? bestScene = null;
            double bestScore = double.MaxValue;
            CatalogScene? lowestCloudScene = null;
            double lowestCloud = double.MaxValue;

            foreach (var feature in features)
            {
                if (feature == null) continue;
                var props = feature["properties"];
                if (props == null) continue;

                var id = feature["id"]?.GetValue<string>() ?? string.Empty;
                var dtStr = props["datetime"]?.GetValue<string>();
                var cloudCover = props["eo:cloud_cover"]?.GetValue<double>() ?? 0.0;

                if (DateTime.TryParse(dtStr, out var sceneDt))
                {
                    var scene = new CatalogScene
                    {
                        Id = id,
                        DateTime = sceneDt,
                        CloudCover = Math.Round(cloudCover, 1)
                    };

                    if (cloudCover < lowestCloud)
                    {
                        lowestCloud = cloudCover;
                        lowestCloudScene = scene;
                    }

                    // Score balances closeness to target date with low cloud coverage
                    var diffDays = Math.Abs((sceneDt - targetDate).TotalDays);
                    var score = diffDays * 1.5 + (cloudCover / 10.0);

                    // Prefer scenes within the user cloud tolerance if available
                    if (cloudCover <= maxCloudCoverage)
                    {
                        if (score < bestScore)
                        {
                            bestScore = score;
                            bestScene = scene;
                        }
                    }
                }
            }

            // If no scene meets strict maxCloudCoverage, fallback to lowest cloud scene available
            var finalScene = bestScene ?? lowestCloudScene;
            if (finalScene != null)
            {
                _logger.LogInformation("Catalog selected scene {Id} from {Date} (Cloud: {Cloud}%)", finalScene.Id, finalScene.DateTime, finalScene.CloudCover);
            }
            return finalScene;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while searching Sentinel Catalog API.");
            return null;
        }
    }
}
