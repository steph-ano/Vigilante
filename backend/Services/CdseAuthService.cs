using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace Vigilante.Api.Services;

public class CdseAuthService : ICdseAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _memoryCache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CdseAuthService> _logger;

    private const string CacheKey = "CDSE_ACCESS_TOKEN";

    public CdseAuthService(
        IHttpClientFactory httpClientFactory,
        IMemoryCache memoryCache,
        IConfiguration configuration,
        ILogger<CdseAuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _memoryCache = memoryCache;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured()
    {
        var clientId = _configuration["Copernicus:ClientId"];
        var clientSecret = _configuration["Copernicus:ClientSecret"];
        return !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret);
    }

    public async Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        if (_memoryCache.TryGetValue(CacheKey, out string? cachedToken) && !string.IsNullOrWhiteSpace(cachedToken))
        {
            return cachedToken;
        }

        var clientId = _configuration["Copernicus:ClientId"];
        var clientSecret = _configuration["Copernicus:ClientSecret"];
        var tokenEndpoint = _configuration["Copernicus:TokenEndpoint"] 
            ?? "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            _logger.LogWarning("Copernicus CDSE ClientId or ClientSecret is not configured in appsettings.json. Running in simulated fallback mode.");
            return null;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("CdseAuth");
            var requestContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials"),
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret)
            });

            var response = await client.PostAsync(tokenEndpoint, requestContent, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to obtain CDSE token. Status: {Status}, Details: {Details}", response.StatusCode, errorBody);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var tokenResponse = JsonSerializer.Deserialize<TokenResponse>(json);

            if (tokenResponse?.AccessToken != null)
            {
                // Expire slightly before actual expiry (default CDSE token is ~600 seconds)
                var cacheDuration = TimeSpan.FromSeconds(Math.Max(60, tokenResponse.ExpiresIn - 60));
                _memoryCache.Set(CacheKey, tokenResponse.AccessToken, cacheDuration);
                _logger.LogInformation("Successfully acquired CDSE access token. Cached for {Duration}s", cacheDuration.TotalSeconds);
                return tokenResponse.AccessToken;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while requesting CDSE OAuth token.");
        }

        return null;
    }

    private class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }
    }
}
