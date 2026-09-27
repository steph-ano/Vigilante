using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public interface IImageCacheService
{
    Task<ImageResult?> GetCachedImageAsync(string cacheKey);
    Task SetCachedImageAsync(string cacheKey, ImageResult image, TimeSpan? duration = null);
    string GenerateKey(BoundingBox bbox, DateTime dateFrom, DateTime dateTo, string mode, int width, int height);
}
