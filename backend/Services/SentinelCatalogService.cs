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
        int searchDaysWindow = 7, 
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

        var payload = new
        {
            collections = new[] { "sentinel-2-l2a" },
            datetime = $"{dateFrom}/{dateTo}",
            bbox = bbox.ToArray(),
            limit = 10,
            query = new Dictionary<string, object>
            {
                { "eo:cloud_cover", new { lte = maxCloudCoverage } }
            }
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
                _logger.LogInformation("No scenes found in Catalog for window {From} to {To} with cloud cover <= {MaxCloud}%", dateFrom, dateTo, maxCloudCoverage);
                return null;
            }

            // Find scene closest to target date with acceptable cloud cover
            CatalogScene? bestScene = null;
            double smallestDifferenceDays = double.MaxValue;

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
                    var diffDays = Math.Abs((sceneDt - targetDate).TotalDays);
                    // Weight cloud coverage slightly into score
                    var score = diffDays + (cloudCover / 100.0 * 2.0);

                    if (score < smallestDifferenceDays)
                    {
                        smallestDifferenceDays = score;
                        bestScene = new CatalogScene
                        {
                            Id = id,
                            DateTime = sceneDt,
                            CloudCover = Math.Round(cloudCover, 1)
                        };
                    }
                }
            }

            return bestScene;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while searching Sentinel Catalog API.");
            return null;
        }
    }
}
