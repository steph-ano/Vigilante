using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public class SentinelProcessService : ISentinelProcessService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ICdseAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SentinelProcessService> _logger;

    public SentinelProcessService(
        IHttpClientFactory httpClientFactory,
        ICdseAuthService authService,
        IConfiguration configuration,
        ILogger<SentinelProcessService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _authService = authService;
        _configuration = configuration;
        _logger = logger;
    }

    public string GetEvalscript(string visualizationMode)
    {
        return visualizationMode.ToLowerInvariant() switch
        {
            "false_color_swir" =>
                @"//VERSION=3
function setup() {
  return {
    input: [""B12"", ""B8A"", ""B04""],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B12, 2.5 * sample.B8A, 2.5 * sample.B04];
}",

            "ndwi" =>
                @"//VERSION=3
function setup() {
  return {
    input: [""B03"", ""B08""],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08 + 0.0001);
  if (ndwi > 0.2) return [0.08, 0.42, 0.95];
  if (ndwi > 0.0) return [0.25, 0.65, 0.85];
  return [0.65, 0.55, 0.45];
}",

            "nbr" =>
                @"//VERSION=3
function setup() {
  return {
    input: [""B08"", ""B12""],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  let nbr = (sample.B08 - sample.B12) / (sample.B08 + sample.B12 + 0.0001);
  if (nbr < -0.1) return [0.95, 0.15, 0.1];
  if (nbr < 0.1) return [0.95, 0.55, 0.15];
  if (nbr < 0.25) return [0.9, 0.85, 0.3];
  return [0.15, 0.65, 0.25];
}",

            _ => // Default: True Color RGB
                @"//VERSION=3
function setup() {
  return {
    input: [""B04"", ""B03"", ""B02""],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}"
        };
    }

    public async Task<ImageResult?> FetchSatelliteImageAsync(
        BoundingBox bbox,
        DateTime dateFrom,
        DateTime dateTo,
        string visualizationMode,
        int width = 800,
        int height = 800,
        int maxCloudCoverage = 30,
        CancellationToken cancellationToken = default)
    {
        var token = await _authService.GetAccessTokenAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Cannot call Sentinel Hub Process API without CDSE access token.");
            return null;
        }

        var apiBase = _configuration["Copernicus:ApiBaseUrl"] ?? "https://sh.dataspace.copernicus.eu";
        var processEndpoint = $"{apiBase.TrimEnd('/')}/api/v1/process";

        var evalscript = GetEvalscript(visualizationMode);

        var requestBody = new
        {
            input = new
            {
                bounds = new
                {
                    bbox = bbox.ToArray(),
                    properties = new
                    {
                        crs = "http://www.opengis.net/def/crs/EPSG/0/4326"
                    }
                },
                data = new object[]
                {
                    new
                    {
                        type = "sentinel-2-l2a",
                        dataFilter = new
                        {
                            timeRange = new
                            {
                                from = dateFrom.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"),
                                to = dateTo.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                            },
                            maxCloudCoverage = maxCloudCoverage
                        }
                    }
                }
            },
            output = new
            {
                width = Math.Clamp(width, 256, 2048),
                height = Math.Clamp(height, 256, 2048),
                responses = new[]
                {
                    new
                    {
                        identifier = "default",
                        format = new { type = "image/png" }
                    }
                }
            },
            evalscript = evalscript
        };

        try
        {
            var client = _httpClientFactory.CreateClient("SentinelProcess");
            using var request = new HttpRequestMessage(HttpMethod.Post, processEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("image/png"));

            var json = JsonSerializer.Serialize(requestBody);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Sentinel Process API error {Status}: {Details}", response.StatusCode, errorBody);
                return null;
            }

            var imageBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            var base64 = Convert.ToBase64String(imageBytes);

            return new ImageResult
            {
                ImageBase64 = $"data:image/png;base64,{base64}",
                MimeType = "image/png",
                AcquiredDate = dateTo,
                VisualizationMode = visualizationMode,
                Bbox = bbox
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Sentinel Process API.");
            return null;
        }
    }
}
