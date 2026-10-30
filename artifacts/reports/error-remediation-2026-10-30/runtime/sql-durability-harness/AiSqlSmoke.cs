using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Controllers;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.AI;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

internal static class AiSqlSmoke
{
    private const string Private="sk-private-ai-runtime-marker";
    private static readonly JsonSerializerOptions WebJson=new(JsonSerializerDefaults.Web);
    internal static async Task<int> Run()
    {
        var settingId=Guid.NewGuid();var provider="RuntimeFake-"+settingId.ToString("N");var evidence=new List<object>();
        await using(var db=Program.Open())
        {
            db.AiProviderSettings.Add(new AiProviderSetting{Id=settingId,Provider=provider,DisplayName="Runtime fake only",EncryptedApiKey="synthetic-protected",BaseUrl="https://example.invalid/never-called",DefaultModel="runtime-model",AllowedModelsJson="[\"runtime-model\"]",IsEnabled=true,CreatedAt=DateTimeOffset.UtcNow,UpdatedAt=DateTimeOffset.UtcNow.AddMinutes(1)});
            await db.SaveChangesAsync();
            Program.Check(await db.AiProviderSettings.Where(x=>x.IsEnabled).OrderByDescending(x=>x.UpdatedAt).Select(x=>x.Id).FirstAsync()==settingId,"owned synthetic provider selected");
        }
        foreach(var kind in new[]{"success-continuation","limited-partial","malformed","timeout","invalid-output"})
        {
            Guid user,project=Guid.NewGuid(),question=Guid.NewGuid();var starting=kind=="limited-partial"?5:10;
            await using(var db=Program.Open())
            {
                user=await Program.SeedUser(db);
                db.FormProjects.Add(new FormProject{Id=project,UserId=user,Name="Runtime AI "+kind,FormUrl="https://example.invalid/form",FormActionUrl="https://example.invalid/send",Status="Analyzed",CreatedAt=DateTimeOffset.UtcNow});
                db.FormQuestions.Add(new FormQuestion{Id=question,ProjectId=project,EntryId="entry.1",Label="Synthetic short answer",QuestionType="ShortText",OptionsJson="[]",Required=true});
                db.AiPromptProfiles.Add(new AiPromptProfile{Id=Guid.NewGuid(),UserId=user,ProjectId=project,Mode="Option2",AudienceJson="{}",GlobalPrompt="Create ordinary synthetic short answers.",CreatedAt=DateTimeOffset.UtcNow,UpdatedAt=DateTimeOffset.UtcNow});
                await new CreditService(db).GrantInitialCreditsAsync(user,starting,"FAHERR runtime synthetic fixture grant",CancellationToken.None);
                await db.SaveChangesAsync();
            }
            var calls=0;var responseList=new List<AiGenerateResponsesResponse>();
            var adapter=new FakeAdapter(request=>
            {
                Program.Check(request.Provider==provider,"fake boundary receives owned provider only");calls++;
                if(kind=="malformed")throw new JsonException(Private);
                if(kind=="timeout")throw new TaskCanceledException(Private);
                var output=kind=="invalid-output"?"{\"answers\":[]}":JsonSerializer.Serialize(new{answers=new[]{new{questionId=question,values=new[]{"Synthetic answer"}}}});
                return new AiProviderGenerateResult(Private+"-request",Private+"-response",Enumerable.Repeat(output,request.Count).ToArray());
            });
            var requestCount=kind=="limited-partial"?4:2;
            async Task Generate(int count)
            {
                await using var db=Program.Open();
                var service=new AiGenerationService(db,new UserContext(user),new AiPromptGuardService(),new AiOutputValidator(),adapter,new FakeProtector(),new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>{{"AI:BatchSize","10"},{"AI:MaxParallelBatches","1"}}).Build(),new CreditService(db));
                var result=await new AiResponsesController(service).Generate(project,new AiGenerateResponsesRequest("Option2",count),CancellationToken.None);
                Program.Check(result.Result is OkObjectResult,"actual controller returns 200 result");
                var response=(AiGenerateResponsesResponse)((OkObjectResult)result.Result!).Value!;responseList.Add(response);
                var wire=JsonSerializer.Serialize(response,WebJson);Program.Check(!wire.Contains(Private)&&!wire.Contains("RawProvider")&&wire.Contains(response.RunId.ToString()),"generation DTO safe serialized cause/run ID");
            }
            await Generate(requestCount);if(kind=="success-continuation")await Generate(1);
            await using var fresh=Program.Open();var runs=await fresh.AiGenerationRuns.Where(x=>x.UserId==user&&x.ProjectId==project).ToListAsync();
            var usages=await fresh.UsageLogs.Where(x=>x.UserId==user&&x.ProjectId==project).ToListAsync();
            var ledger=await fresh.CreditTransactions.Where(x=>x.UserId==user).ToListAsync();var debits=ledger.Where(x=>x.Type==CreditTransactionTypes.CreditUsed).ToList();
            var account=await fresh.UserCreditAccounts.SingleAsync(x=>x.UserId==user);var previews=await fresh.GeneratedResponses.Where(x=>x.ProjectId==project).ToListAsync();
            var expectedGenerated=kind=="success-continuation"?3:kind=="limited-partial"?2:0;var expectedCost=expectedGenerated*2;
            Program.Check(runs.Count==responseList.Count&&usages.Count==responseList.Count&&calls==responseList.Count,"exact calls/runs/usage without retry");
            Program.Check(previews.Count==expectedGenerated&&runs.Sum(x=>x.GeneratedCount)==expectedGenerated&&runs.Sum(x=>x.CreditsUsed)==expectedCost,"durable AI run counts/cost/previews");
            Program.Check(account.Balance==starting-expectedCost&&account.TotalUsed==expectedCost&&account.TotalDeposited==starting,"independent SQL credit balance matches service grant/debits");
            Program.Check(ledger.Count==1+debits.Count&&ledger.Count(x=>x.Type==CreditTransactionTypes.InitialGrant)==1&&debits.Sum(x=>x.Amount)==-expectedCost,"ledger uses dedicated credit service only");
            Program.Check(debits.Count==(expectedGenerated==0?0:responseList.Count)&&debits.All(x=>x.ReferenceType==nameof(AiGenerationRun)&&runs.Any(r=>r.Id==x.ReferenceId))&&debits.Select(x=>x.ReferenceId).Distinct().Count()==debits.Count,"one exact debit per successful run");
            Program.Check(responseList.SelectMany(x=>x.GeneratedPreviewIds).Distinct().Count()==expectedGenerated&&responseList.SelectMany(x=>x.GeneratedPreviewIds).All(id=>previews.Any(p=>p.Id==id)),"response continuation IDs persisted without duplication");
            foreach(var response in responseList)
            {
                var run=runs.Single(x=>x.Id==response.RunId);Program.Check(run.Status==response.Status&&run.CreditsUsed==response.CreditsUsed&&run.CompletedAt!=null,"response agrees with fresh persisted run");
                Program.Check(expectedGenerated>0?response.ErrorMessage==null:!string.IsNullOrWhiteSpace(response.ErrorMessage)&&!response.ErrorMessage.Contains(Private),"safe failure message exposed");
            }
            if(kind=="limited-partial")Program.Check(responseList[0].Status=="Partial"&&responseList[0].MissingCredits==4&&responseList[0].BalanceAfter==1,"partial shortage agrees with durable credit");
            var statsResult=await new AiAnalyticsController(new AiAnalyticsService(fresh,new UserContext(user))).GetMyAiUsage(CancellationToken.None);
            Program.Check(statsResult.Result is OkObjectResult,"analytics controller actual DTO result");
            var stats=(AiUsageStatsResponse)((OkObjectResult)statsResult.Result!).Value!;var statsWire=JsonSerializer.Serialize(stats,WebJson);
            Program.Check(stats.TotalRuns==runs.Count&&stats.TotalCreditsUsed==expectedCost&&stats.TotalPreviewsGenerated==expectedGenerated,"analytics fresh SQL totals");
            Program.Check(!statsWire.Contains(Private)&&runs.All(x=>statsWire.Contains(x.Id.ToString())),"safe history DTO preserves run IDs");
            evidence.Add(new{kind,user,project,settingId,calls,starting,expectedGenerated,expectedCost,balance=account.Balance,responseList,usageIds=usages.Select(x=>x.Id),creditTransactionIds=ledger.Select(x=>x.Id),analytics=stats});
            await Program.Write("ai-sql-progress.json",evidence);
        }
        await Program.Write("ai-sql-verification.json",new{status="Verified",cases=6,scenarios=5,actualServices=true,actualControllerDtoSerialization=true,httpHost=false,fakeAdapterOnly=true,creditWrites="CreditService grant and usage methods only",database=Program.Database,settingId,evidence,preservedFixtures=true});
        Console.WriteLine("Verified AI SQL 6 executions/5 scenarios, safe DTO/history, credit ledger and continuation IDs.");return 0;
    }
    private sealed record UserContext(Guid UserId):ICurrentUserContext{public bool IsAdmin=>false;}
    private sealed class FakeAdapter(Func<AiProviderGenerateRequest,AiProviderGenerateResult> handler):IAiProviderAdapter{public Task<AiProviderGenerateResult> GenerateAsync(AiProviderGenerateRequest r,CancellationToken t)=>Task.FromResult(handler(r));}
    private sealed class FakeProtector:IAiProviderSecretProtector{public string Protect(string v)=>"synthetic-protected";public string Unprotect(string v)=>"synthetic-runtime-key";public string Preview(string v)=>"***";}
}
