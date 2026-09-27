namespace Vigilante.Api.Services;

public interface ICdseAuthService
{
    bool IsConfigured();
    Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default);
}
