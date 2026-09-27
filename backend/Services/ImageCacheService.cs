using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public class ImageCacheService : IImageCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<ImageCacheService> _logger;
    private readonly string _diskCacheFolder;

    public ImageCacheService(
        IMemoryCache memoryCache, 
        IWebHostEnvironment env, 
        ILogger<ImageCacheService> logger)
    {
        _memoryCache = memoryCache;
        _logger = logger;
        _diskCacheFolder = Path.Combine(env.ContentRootPath, "Cache", "Images");
        Directory.CreateDirectory(_diskCacheFolder);
    }

    public string GenerateKey(BoundingBox bbox, DateTime dateFrom, DateTime dateTo, string mode, int width, int height)
    {
        var raw = $"{bbox.MinX:F5}_{bbox.MinY:F5}_{bbox.MaxX:F5}_{bbox.MaxY:F5}_{dateFrom:yyyyMMdd}_{dateTo:yyyyMMdd}_{mode}_{width}x{height}";
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public async Task<ImageResult?> GetCachedImageAsync(string cacheKey)
    {
        // 1. Check in-memory cache
        if (_memoryCache.TryGetValue(cacheKey, out ImageResult? memImage) && memImage != null)
        {
            _logger.LogInformation("Memory cache hit for image key: {Key}", cacheKey);
            return memImage;
        }

        // 2. Check disk cache
        var filePath = Path.Combine(_diskCacheFolder, $"{cacheKey}.json");
        if (File.Exists(filePath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(filePath);
                var diskImage = JsonSerializer.Deserialize<ImageResult>(json);
                if (diskImage != null)
                {
                    _memoryCache.Set(cacheKey, diskImage, TimeSpan.FromHours(4));
                    _logger.LogInformation("Disk cache hit for image key: {Key}", cacheKey);
                    return diskImage;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read disk cache for key {Key}", cacheKey);
            }
        }

        return null;
    }

    public async Task SetCachedImageAsync(string cacheKey, ImageResult image, TimeSpan? duration = null)
    {
        _memoryCache.Set(cacheKey, image, duration ?? TimeSpan.FromHours(6));

        try
        {
            var filePath = Path.Combine(_diskCacheFolder, $"{cacheKey}.json");
            var json = JsonSerializer.Serialize(image);
            await File.WriteAllTextAsync(filePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save image to disk cache {Key}", cacheKey);
        }
    }
}
