using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

internal static class GenerationContractFence
{
    public static ObjectResult? Check(ControllerBase controller)
    {
        if (controller.ControllerContext.HttpContext?.Request.Headers["X-FormAuto-Contract-Version"].ToString() == "2") return null;
        return new ObjectResult(new ProblemDetails { Status = 409, Title = "Client upgrade required", Extensions = { ["code"] = "ClientUpgradeRequired" } }) { StatusCode = 409 };
    }
}
