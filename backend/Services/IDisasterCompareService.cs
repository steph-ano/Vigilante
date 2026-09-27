using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public interface IDisasterCompareService
{
    Task<CompareResponse> CompareDisasterImagesAsync(CompareRequest request, CancellationToken cancellationToken = default);
}
