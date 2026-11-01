using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using FormAutoHub.Api.Integrations.GoogleForms;
using FormAutoHub.Api.Services;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

// Runtime-only validation. Exact accepted clone, no schema/cleanup/provider calls.
internal static class Program
{
    internal const string Database = "FormAutoHub_FAHERR001_restore_20261029_a19f7a2";
    internal static readonly string Connection = new SqlConnectionStringBuilder { DataSource="DESKTOP-TS5JR7L", InitialCatalog=Database, IntegratedSecurity=true, TrustServerCertificate=true, ApplicationName="FAHERR001.RuntimeHarness", ConnectTimeout=10 }.ConnectionString;
    internal static readonly DbContextOptions<FormAutoHubDbContext> Options = new DbContextOptionsBuilder<FormAutoHubDbContext>().UseSqlServer(Connection).Options;
    private static readonly List<object> Results = [];
    internal static void Check(bool value, string label) { if (!value) throw new InvalidOperationException("Assertion: " + label); }
    internal static FormAutoHubDbContext Open() => new(Options);
    public static async Task<int> Main(string[] args)
    {
        try
        {
            await Guard();
            if (args.Contains("guard")) return 0;
            if (args.Contains("api")) return await ApiSmoke.Run();
            if (args.Contains("ai")) return await AiSqlSmoke.Run();
            foreach(var kind in new[]{"transport","cancel","initial-save","final-save"}) await Submission(kind);
            foreach(var cancel in new[]{false,true}) await Collect(cancel);
            foreach(var kind in new[]{"questions-false","questions-throw","import-null"}) await Generate(kind);
            await Write("verification.json", new { status="Verified", cases=Results, count=Results.Count, fakeOutboundOnly=true, noSchema=true, mainExcluded=true, preservedFixtures=true });
            Console.WriteLine($"Verified SQL durability {Results.Count}/9; fake outbound; clone only.");
            return 0;
        }
        catch(Exception e)
        {
            await Write("failure.json", new { status="Failed", type=e.GetType().Name, message=e.Message, stack=e.StackTrace, completed=Results });
            Console.Error.WriteLine($"Failed: {e.GetType().Name}: {e.Message}"); return 1;
        }
    }
    internal static Task Write(string name, object value) => File.WriteAllTextAsync(Path.Combine(AppContext.BaseDirectory,"..","..","..",name),JsonSerializer.Serialize(value,new JsonSerializerOptions{WriteIndented=true}));
    internal static async Task Guard()
    {
        await using var db=Open(); await db.Database.OpenConnectionAsync();
        await using var command=db.Database.GetDbConnection().CreateCommand();
        command.CommandText="SELECT CONVERT(nvarchar(128),SERVERPROPERTY('ServerName')), DB_NAME(), DB_ID()";
        await using var reader=await command.ExecuteReaderAsync(); await reader.ReadAsync();
        var server=reader.GetString(0); var database=reader.GetString(1); var id=Convert.ToInt32(reader.GetValue(2)); await reader.DisposeAsync();
        Check(server=="DESKTOP-TS5JR7L" && database==Database && id==8,"exact accepted restore clone identity");
        var pending=(await db.Database.GetPendingMigrationsAsync()).ToArray();
        var modelPending=db.Database.HasPendingModelChanges(); Check(pending.Length==0 && !modelPending,"pending migrations/model zero");
        await Write("fresh-guard.json",new { utc=DateTimeOffset.UtcNow,server,database,id,pending,modelPending,readOnly=true });
    }
    internal static async Task<Guid> SeedUser(FormAutoHubDbContext db)
    {
        var id=Guid.NewGuid(); db.Users.Add(new User{Id=id,Email=$"faherr-runtime-{id:N}@example.invalid",FullName="Runtime synthetic",Role="User",CreatedAt=DateTimeOffset.UtcNow});
        await db.SaveChangesAsync(); return id;
    }
    private static async Task Submission(string kind)
    {
        var ids=Enumerable.Range(0,kind=="transport"?3:2).Select(_=>Guid.NewGuid()).ToArray();
        var projectId=Guid.NewGuid(); Guid user;
        await using(var seed=Open())
        {
            user=await SeedUser(seed);
            seed.FormProjects.Add(new FormProject{Id=projectId,UserId=user,Name="FAHERR runtime "+kind,FormUrl="https://example.invalid/form",FormActionUrl="https://example.invalid/send",CreatedAt=DateTimeOffset.UtcNow});
            foreach(var id in ids) seed.GeneratedResponses.Add(new GeneratedResponse{Id=id,ProjectId=projectId,Status=GeneratedResponseStatuses.Previewed,CreatedAt=DateTimeOffset.UtcNow,PayloadJson=JsonSerializer.Serialize(new[]{new GeneratedAnswerResponse(Guid.NewGuid(),"entry.1","Synthetic","ShortText",new[]{"synthetic"})})});
            await seed.SaveChangesAsync();
        }
        using var cancel=new CancellationTokenSource(); var calls=0;
        Exception expected=kind=="cancel"?new OperationCanceledException(cancel.Token):kind.Contains("save")?new DbUpdateException("Synthetic save failure"):new HttpRequestException("private synthetic transport");
        var options=kind.Contains("save")?new DbContextOptionsBuilder<FormAutoHubDbContext>(Options).AddInterceptors(new SaveFault(expected,kind=="final-save")).Options:Options;
        var client=new SubmitClient(async()=>
        {
            calls++;
            if(kind=="transport" && calls==2)
            {
                await using var independent=Open();
                Check(await independent.SubmissionLogs.CountAsync(x=>ids.Contains(x.ResponseId)&&x.Status==SubmissionLogStatuses.Success)==1,"SQL committed success visible before second outbound"); throw expected;
            }
            if(kind=="cancel") { cancel.Cancel(); throw expected; }
            return new GoogleFormSubmitResult(true,"");
        });
        Exception? caught=null;
        await using(var serviceDb=new FormAutoHubDbContext(options))
        { try { await new SubmissionService(serviceDb,new UserContext(user),client).SendAsync(projectId,new SendSubmissionRequest(ids,true),cancel.Token); } catch(Exception e){caught=e;} }
        Check(ReferenceEquals(expected,caught),"original submission exception retained");
        await using var fresh=Open();
        var job=await fresh.SubmissionJobs.SingleAsync(x=>x.ProjectId==projectId);
        var logs=await fresh.SubmissionLogs.Where(x=>x.JobId==job.Id).ToListAsync();
        var usages=await fresh.UsageLogs.Where(x=>x.ProjectId==projectId && x.UserId==user).ToListAsync();
        Check(job.Status==SubmissionJobStatuses.Failed && job.FinishedAt!=null,"durable terminal failed job");
        Check(usages.Count==1 && usages[0].Status==UsageLogStatuses.Failed && usages[0].CreditsUsed==0,"one honest zero-credit usage");
        Check(!await fresh.CreditTransactions.AnyAsync(x=>x.UserId==user),"no credit ledger mutation");
        if(kind=="transport")
        {
            Check(calls==2 && logs.Count==2 && job.SuccessCount==1 && job.FailedCount==0,"transport exact calls/counts");
            Check(logs.Any(x=>x.Status==SubmissionLogStatuses.Success)&&logs.Any(x=>x.ErrorMessage.Contains("chưa xác định")),"known and uncertain durable results");
            Check(await fresh.GeneratedResponses.CountAsync(x=>x.ProjectId==projectId&&x.Status==GeneratedResponseStatuses.Submitted)==1,"only known successful preview submitted");
        }
        else if(kind=="cancel") Check(calls==1&&logs.Count==1&&logs[0].ErrorMessage.Contains("chưa xác định"),"cancel preserves one uncertain attempt without retry");
        else if(kind=="initial-save") Check(calls==0&&logs.Count==1&&logs[0].ErrorMessage.Contains("chưa thực hiện"),"initial persistence fault no outbound");
        else Check(calls==ids.Length&&logs.Count==ids.Length&&logs.All(x=>x.Status==SubmissionLogStatuses.Success)&&job.SuccessCount==ids.Length,"final save fault preserves known results once");
        Check(logs.All(x=>!x.ErrorMessage.Contains("private synthetic")),"no provider private text");
        Results.Add(new{caseName="submission-"+kind,user,projectId,jobId=job.Id,calls,attempts=logs.Select(x=>new{x.Id,x.ResponseId,x.Status}).ToArray(),usageId=usages[0].Id});
        await Write("progress.json",Results);
    }
    private static async Task<(Guid User,Guid Model,Guid Form)> SeedResearch()
    {
        await using var db=Open(); var user=await SeedUser(db); var form=Guid.NewGuid();var model=Guid.NewGuid();var question=Guid.NewGuid();var variable=Guid.NewGuid();var now=DateTimeOffset.UtcNow;
        db.ResearchForms.Add(new ResearchForm{Id=form,UserId=user,GoogleFormId="source-"+form.ToString("N"),Title="Synthetic",FormUrl="https://example.invalid/form",Status="Draft",CreatedAt=now,UpdatedAt=now,ImportedAt=now});
        db.ResearchModels.Add(new ResearchModel{Id=model,UserId=user,FormId=form,Name="Synthetic model",Status="Active",CreatedAt=now,UpdatedAt=now});
        db.ResearchFormQuestions.Add(new ResearchFormQuestion{Id=question,FormId=form,GoogleQuestionId="q1",QuestionText="Synthetic",QuestionType="shortText"});
        db.ResearchVariables.Add(new ResearchVariable{Id=variable,ModelId=model,Name="Synthetic",Code="A",VariableType="Independent",ScaleType="Nominal"});
        db.ObservedQuestionMappings.Add(new ObservedQuestionMapping{Id=Guid.NewGuid(),VariableId=variable,FormQuestionId=question,ObservedCode="A1"});
        db.UserExternalLogins.Add(new UserExternalLogin{Id=Guid.NewGuid(),UserId=user,Provider="Google",ProviderUserId="runtime-"+user.ToString("N"),Email=$"runtime-{user:N}@example.invalid",Scopes="https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/forms.responses.readonly",CreatedAt=now,UpdatedAt=now});
        await db.SaveChangesAsync();return(user,model,form);
    }
    private static async Task Collect(bool cancelRequest)
    {
        var seed=await SeedResearch(); using var cancel=new CancellationTokenSource();var calls=0;
        Exception expected=cancelRequest?new OperationCanceledException(cancel.Token):new HttpRequestException("private synthetic response");
        var api=new FormsApi{Collect=async()=>{calls++;await using var other=Open();Check(await other.DataCollectionLogs.CountAsync(x=>x.ModelId==seed.Model)==1,"collection started log visible before remote");if(cancelRequest)cancel.Cancel();throw expected;}};
        Exception? caught=null;
        await using(var db=Open()){try{await new ResearchDataService(db,new OAuth(),api).CollectResponsesAsync(seed.User,seed.Model,cancel.Token);}catch(Exception e){caught=e;}}
        Check(ReferenceEquals(expected,caught)&&calls==1,"collection retains cause without retry");
        await using var fresh=Open(); var log=await fresh.DataCollectionLogs.SingleAsync(x=>x.ModelId==seed.Model);
        Check(log.Status=="Failed"&&log.CompletedAt!=null&&!log.ErrorMessage!.Contains("private synthetic"),"durable safe failed collection");
        Check(!await fresh.SurveyResponses.AnyAsync(x=>x.ModelId==seed.Model),"no fake survey responses");
        Results.Add(new{caseName="collect-"+(cancelRequest?"cancel":"throw"),seed.User,seed.Model,logId=log.Id,calls});await Write("progress.json",Results);
    }
    private static async Task Generate(string kind)
    {
        var seed=await SeedResearch();var calls=0;
        var api=new FormsApi{Questions=async()=>{calls++;await using var other=Open();var a=await other.AuditLogs.SingleAsync(x=>x.UserId==seed.User&&x.TargetId==seed.Model);Check(a.MetadataJson.Contains("remote-created-id")&&!a.MetadataJson.Contains("synthetic-access-token"),"remote creation audit committed before question call");if(kind=="questions-throw")throw new HttpRequestException("private synthetic question");return kind!="questions-false";}};
        await using(var db=Open())
        {
            try{var result=await new ResearchFormService(db,new OAuth(),api).GenerateFormAsync(seed.User,seed.Model,new NckhGenerateFormRequest("create"),CancellationToken.None);Check(kind!="questions-throw"&&result.Status==ResearchFormServiceStatus.ExternalError,"generate safe external result");}
            catch(HttpRequestException){Check(kind=="questions-throw","expected generate exception");}
        }
        await using var fresh=Open();Check(await fresh.ResearchForms.CountAsync(x=>x.UserId==seed.User)==1,"no fake local generated form");
        var audit=await fresh.AuditLogs.SingleAsync(x=>x.UserId==seed.User&&x.TargetId==seed.Model);using var metadata=JsonDocument.Parse(audit.MetadataJson);
        Check(metadata.RootElement.GetProperty("remoteFormId").GetString()=="remote-created-id"&&metadata.RootElement.GetProperty("modelId").GetGuid()==seed.Model,"durable remote form and model identity");
        Results.Add(new{caseName="generate-"+kind,seed.User,seed.Model,auditId=audit.Id,calls});await Write("progress.json",Results);
    }
    private sealed record UserContext(Guid UserId):ICurrentUserContext { public bool IsAdmin=>false; }
    private sealed class SaveFault(Exception fault,bool finalSave):SaveChangesInterceptor
    {
        private bool thrown;
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData e,InterceptionResult<int> r,CancellationToken token=default)
        { var db=e.Context!;var match=finalSave?db.ChangeTracker.Entries<UsageLog>().Any(x=>x.State==EntityState.Added):db.ChangeTracker.Entries<SubmissionLog>().Any(x=>x.State==EntityState.Added);if(!thrown&&match){thrown=true;throw fault;}return base.SavingChangesAsync(e,r,token); }
    }
    private sealed class SubmitClient(Func<Task<GoogleFormSubmitResult>> submit):IGoogleFormsClient
    { public Task<GoogleFormAnalysis> AnalyzeAsync(string u,CancellationToken t)=>throw new NotSupportedException();public Task<GoogleFormSubmitResult> SubmitAsync(string u,IReadOnlyDictionary<string,IReadOnlyList<string>> a,CancellationToken t)=>submit(); }
    private sealed class OAuth:IGoogleOAuthService
    { public Task<GoogleOAuthTokens?> ExchangeCodeAsync(string c,string u,CancellationToken t)=>throw new NotSupportedException();public Task<GoogleOAuthTokens?> RefreshAccessTokenAsync(string r,CancellationToken t)=>throw new NotSupportedException();public Task StoreTokensAsync(Guid i,GoogleOAuthTokens v,CancellationToken t)=>throw new NotSupportedException();public Task<string?> GetValidAccessTokenAsync(Guid u,CancellationToken t)=>Task.FromResult<string?>("synthetic-access-token"); }
    private sealed class FormsApi:IGoogleFormsApiService
    {
        public Func<Task<IReadOnlyList<GoogleFormResponseItem>?>> Collect{get;init;}=()=>Task.FromResult<IReadOnlyList<GoogleFormResponseItem>?>([]);public Func<Task<bool>> Questions{get;init;}=()=>Task.FromResult(true);
        public Task<GoogleFormStructure?> GetFormStructureAsync(string t,string i,CancellationToken c)=>Task.FromResult<GoogleFormStructure?>(null);
        public Task<GoogleFormCreateResult?> CreateFormAsync(string t,string n,CancellationToken c)=>Task.FromResult<GoogleFormCreateResult?>(new("remote-created-id","https://example.invalid/remote-created-id"));
        public Task<bool> CreateQuestionsAsync(string t,string i,IReadOnlyList<GoogleFormQuestionDraft> q,CancellationToken c)=>Questions();
        public Task<IReadOnlyList<GoogleFormResponseItem>?> ListResponsesAsync(string t,string i,CancellationToken c)=>Collect();
    }
}
