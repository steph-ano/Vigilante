using Microsoft.AspNetCore.Mvc;
using Vigilante.Api.Models;
using Vigilante.Api.Services;

namespace Vigilante.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DisasterController : ControllerBase
{
    private readonly IDisasterCompareService _compareService;
    private readonly IDisasterPresetService _presetService;
    private readonly ICdseAuthService _authService;
    private readonly ILogger<DisasterController> _logger;

    public DisasterController(
        IDisasterCompareService compareService,
        IDisasterPresetService presetService,
        ICdseAuthService authService,
        ILogger<DisasterController> logger)
    {
        _compareService = compareService;
        _presetService = presetService;
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Compara imágenes de satélite antes y después de un desastre natural usando Copernicus Sentinel-2
    /// </summary>
    [HttpPost("compare")]
    [HttpPost("/api/compare")]
    public async Task<ActionResult<CompareResponse>> Compare([FromBody] CompareRequest request, CancellationToken cancellationToken)
    {
        if (request == null || request.Bbox == null)
        {
            return BadRequest(new { error = "El BoundingBox (bbox) es requerido." });
        }

        try
        {
            var response = await _compareService.CompareDisasterImagesAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing compare request.");
            return StatusCode(500, new { error = "Ocurrió un error procesando las imágenes satelitales.", details = ex.Message });
        }
    }

    /// <summary>
    /// Retorna los casos de estudio y desastres históricos preconfigurados en el Perú
    /// </summary>
    [HttpGet("presets")]
    [HttpGet("/api/presets")]
    public ActionResult<IEnumerable<DisasterPreset>> GetPresets()
    {
        return Ok(_presetService.GetAllPresets());
    }

    /// <summary>
    /// Obtiene un caso de estudio por ID
    /// </summary>
    [HttpGet("presets/{id}")]
    public ActionResult<DisasterPreset> GetPreset(string id)
    {
        var preset = _presetService.GetPresetById(id);
        if (preset == null) return NotFound(new { error = $"Preset '{id}' no encontrado." });
        return Ok(preset);
    }

    /// <summary>
    /// Estado del servicio y de la conexión con Copernicus Data Space Ecosystem (CDSE)
    /// </summary>
    [HttpGet("status")]
    public ActionResult GetStatus()
    {
        bool isConfigured = _authService.IsConfigured();
        return Ok(new
        {
            service = "Vigilante Disaster Satellite Monitor API",
            status = "Online",
            cdseConfigured = isConfigured,
            copernicusEndpoint = "https://sh.dataspace.copernicus.eu",
            tokenEndpoint = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
            supportedModes = new[]
            {
                new { id = "true_color", name = "RGB Natural", bands = "B04, B03, B02", description = "Visión humana directa" },
                new { id = "false_color_swir", name = "Falso Color SWIR/NIR", bands = "B12, B8A, B04", description = "Resalta lodo, sedimento y cicatrices de fuego" },
                new { id = "ndwi", name = "Índice NDWI (Agua)", bands = "B03, B08", description = "Detección precisa de inundaciones y desbordes" },
                new { id = "nbr", name = "Índice NBR (Fuego)", bands = "B08, B12", description = "Identificación de áreas calcinadas e incendios" }
            }
        });
    }
}
