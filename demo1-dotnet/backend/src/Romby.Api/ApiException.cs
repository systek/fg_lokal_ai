using Microsoft.AspNetCore.Diagnostics;

namespace Romby.Api;

/// <summary>Throw from anywhere to answer with a given status code and message (like Spring's ResponseStatusException).</summary>
public class ApiException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class ApiExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not ApiException apiException) return false; // let the default handler return 500

        context.Response.StatusCode = apiException.StatusCode;
        // The frontend reads "message" from error responses.
        await context.Response.WriteAsJsonAsync(
            new { status = apiException.StatusCode, message = apiException.Message },
            cancellationToken);
        return true;
    }
}
