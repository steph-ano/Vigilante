using Vigilante.Api.Models;

namespace Vigilante.Api.Services;

public interface IDisasterPresetService
{
    IReadOnlyList<DisasterPreset> GetAllPresets();
    DisasterPreset? GetPresetById(string id);
}
