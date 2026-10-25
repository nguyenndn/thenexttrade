using System.Text.Json;
using Mt5Bridge;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("MT5_BRIDGE_PORT") ?? "5055";
if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddSingleton<ServerResolver>();
builder.Services.AddSingleton<Mt5SessionManager>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Mt5SessionManager>());

var app = builder.Build();
app.UseCors();

// Health check
app.MapGet("/health", (Mt5SessionManager mgr) => Results.Ok(mgr.GetHealth()));

// Live server resolver & search
app.MapGet("/servers", (string? q, ServerResolver resolver) =>
    Results.Ok(new { servers = resolver.SearchServers(q ?? "") }));

// Connect an MT5 account directly to broker TCP socket
app.MapPost("/connect", (ConnectRequest req, Mt5SessionManager mgr) =>
{
    try
    {
        var state = mgr.ConnectAccount(req);
        return Results.Ok(new { success = true, state });
    }
    catch (UnauthorizedAccessException uex)
    {
        return Results.Json(new { success = false, error = uex.Message, code = "AUTH_FAILED" }, statusCode: 401);
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, error = ex.Message, code = "CONNECT_FAILED" }, statusCode: 400);
    }
});

// Disconnect an MT5 account
app.MapPost("/disconnect", (DisconnectRequest req, Mt5SessionManager mgr) =>
{
    var removed = mgr.DisconnectAccount(req.Login);
    return Results.Ok(new { success = true, disconnected = removed });
});

// Get live state for a connected MT5 account
app.MapGet("/state/{login}", (ulong login, string? symbol, int? timeframe, Mt5SessionManager mgr) =>
{
    var state = mgr.GetState(login, symbol, timeframe ?? 15);
    if (state == null || !state.Connected)
    {
        return Results.Json(new { success = false, error = state?.ErrorMessage ?? "Account not connected in Cloud Bridge", code = "NOT_CONNECTED" }, statusCode: 404);
    }
    return Results.Ok(new { success = true, state });
});

// Execute 1-tap trade risk action (Breakeven, Secure Profit, Derisk, Trim, Cut Loss, Close All)
app.MapPost("/execute", (ExecuteCommandRequest req, Mt5SessionManager mgr) =>
{
    try
    {
        var result = mgr.Execute(req);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException kex)
    {
        return Results.Json(new { success = false, error = kex.Message, code = "NOT_CONNECTED" }, statusCode: 404);
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, error = ex.Message, code = "EXECUTE_FAILED" }, statusCode: 400);
    }
});

// Manage 24/5 server-side armed rules (BE at price, Close at price, Daily Loss/Profit Limit)
app.MapPost("/rules", (ManageRuleRequest req, Mt5SessionManager mgr) =>
{
    try
    {
        var state = mgr.ManageRules(req);
        return Results.Ok(new { success = true, state });
    }
    catch (KeyNotFoundException kex)
    {
        return Results.Json(new { success = false, error = kex.Message, code = "NOT_CONNECTED" }, statusCode: 404);
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, error = ex.Message, code = "RULE_FAILED" }, statusCode: 400);
    }
});

// Admin endpoint: get all connected accounts & bridge telemetry
app.MapGet("/admin/connections", (Mt5SessionManager mgr) =>
{
    return Results.Ok(new
    {
        success = true,
        health = mgr.GetHealth(),
        connections = mgr.GetAllConnections()
    });
});

app.Run();
