using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public interface ISimulatedSatelliteService
{
    ImageResult GenerateSimulatedImage(
        BoundingBox bbox,
        DateTime date,
        string visualizationMode,
        string eventType,
        bool isAftermath,
        int width = 800,
        int height = 800);
}
