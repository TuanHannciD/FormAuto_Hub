using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

internal static class ApiSmoke
{
    internal static async Task<int> Run()
    {
        Program.Check(!IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners().Any(x=>x.Port==5248),"API port free before acquire");
        var user=Guid.NewGuid();var admin=Guid.NewGuid();var project=Guid.NewGuid();var question=Guid.NewGuid();var package=Guid.NewGuid();var evidence=Guid.NewGuid();var order=Guid.NewGuid();
        var password=Convert.ToBase64String(RandomNumberGenerator.GetBytes(24));var signing=Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));var now=DateTimeOffset.UtcNow;
        string Email(Guid id)=>$"faherr-http-{id:N}@example.invalid";
        var bytes=new byte[]{137,80,78,71,13,10,26,10,0,1,2,3};
        await using(var db=Program.Open())
        {
            var hasher=new PasswordHasher();
            db.Users.AddRange(new User{Id=user,Email=Email(user),PasswordHash=hasher.Hash(password),FullName="HTTP synthetic user",Role="User",CreatedAt=now},new User{Id=admin,Email=Email(admin),PasswordHash=hasher.Hash(password),FullName="HTTP synthetic admin",Role="Admin",CreatedAt=now});
            db.FormProjects.Add(new FormProject{Id=project,UserId=user,Name="HTTP synthetic",FormUrl="https://example.invalid/form",FormActionUrl="https://example.invalid/send",CreatedAt=now});
            db.FormQuestions.Add(new FormQuestion{Id=question,ProjectId=project,Label="Synthetic",EntryId="entry.1",QuestionType="ShortText",OptionsJson="[]"});
            db.CreditPackages.Add(new CreditPackage{Id=package,Name="FAHERR HTTP synthetic",Credits=1,Price=1,IsActive=false,CreatedAt=now});
            db.TopupEvidence.Add(new TopupEvidence{Id=evidence,UserId=user,FileName="synthetic.png",ContentType="image/png",Content=bytes,Length=bytes.Length,CreatedAt=now});
            await db.SaveChangesAsync();
            db.TopupOrders.Add(new TopupOrder{Id=order,UserId=user,PackageId=package,EvidenceFileId=evidence,Credits=1,Amount=1,Status="Pending",PaymentMethod="Manual",PaymentNote="Runtime fixture only",CreatedAt=now});
            await db.SaveChangesAsync();
        }
        var apiDll=Path.GetFullPath("../../../../../src/FormAutoHub.Api/bin/Release/net9.0/FormAutoHub.Api.dll",Directory.GetCurrentDirectory());
        Program.Check(File.Exists(apiDll),"actual API binary exists");
        var start=new ProcessStartInfo("dotnet"){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,WorkingDirectory=Directory.GetCurrentDirectory()};start.ArgumentList.Add(apiDll);
        start.Environment["ASPNETCORE_URLS"]="http://127.0.0.1:5248";start.Environment["ASPNETCORE_ENVIRONMENT"]="Production";
        start.Environment["ConnectionStrings__DefaultConnection"]=Program.Connection;start.Environment["Auth__SigningKey"]=signing;
        start.Environment["Auth__Issuer"]="FormAutoHub";start.Environment["Auth__Audience"]="FormAutoHub";start.Environment["AI__ProviderAdapter"]="Disabled";
        start.Environment["Auth__GoogleClientId"]="";start.Environment["Auth__GoogleOAuthClientId"]="";start.Environment["Auth__GoogleOAuthClientSecret"]="";
        start.Environment["Logging__LogLevel__Default"]="Warning";start.Environment["Logging__LogLevel__Microsoft"]="Warning";
        var logs=new List<string>();var responses=new List<object>();var json=new JsonSerializerOptions(JsonSerializerDefaults.Web);
        using var process=new Process{StartInfo=start};
        process.OutputDataReceived+=(_,e)=>{if(e.Data!=null)lock(logs){if(logs.Count<200)logs.Add(e.Data);}};
        process.ErrorDataReceived+=(_,e)=>{if(e.Data!=null)lock(logs){if(logs.Count<200)logs.Add(e.Data);}};
        await Program.Guard(); // Fresh pending0 immediately before actual Program's no-op Migrate.
        process.Start();process.BeginOutputReadLine();process.BeginErrorReadLine();var pid=process.Id;
        await Program.Write("api-identity.json",new{pid,executable="dotnet",apiDll,binarySha256=Convert.ToHexString(SHA256.HashData(await File.ReadAllBytesAsync(apiDll))),database=Program.Database,guard="fresh pending0/modelPendingfalse",actualProgram=true,user,admin,project,question,package,evidence,order,startedAt=DateTimeOffset.UtcNow});
        try
        {
            using var client=new HttpClient(new HttpClientHandler{AllowAutoRedirect=false}){BaseAddress=new Uri("http://127.0.0.1:5248"),Timeout=TimeSpan.FromSeconds(15)};
            var ready=false;for(var i=0;i<80;i++){if(process.HasExited)break;try{using var h=await client.GetAsync("/health");if(h.StatusCode==HttpStatusCode.OK){ready=true;break;}}catch(HttpRequestException){}await Task.Delay(250);}
            Program.Check(ready,"actual API health ready");
            async Task<HttpResponseMessage> Request(string label,HttpMethod method,string path,int expected,object? body=null,string? token=null)
            {
                using var request=new HttpRequestMessage(method,path);if(body!=null)request.Content=JsonContent.Create(body);if(token!=null)request.Headers.Authorization=new AuthenticationHeaderValue("Bearer",token);
                var response=await client.SendAsync(request);var text=await response.Content.ReadAsStringAsync();
                Program.Check((int)response.StatusCode==expected,label+" HTTP expected "+expected+" actual "+(int)response.StatusCode);
                Program.Check(!text.Contains(signing)&&!text.Contains(password),label+" no secret echo");
                responses.Add(new{label,method=method.Method,path,status=(int)response.StatusCode,contentType=response.Content.Headers.ContentType?.MediaType});return response;
            }
            using(await Request("anonymous protected",HttpMethod.Get,"/api/profile",401)){}
            using(await Request("MVC missing fields",HttpMethod.Post,"/api/auth/login",400,new{})){}
            using(await Request("wrong credentials",HttpMethod.Post,"/api/auth/login",401,new LoginRequest(Email(user),"wrong-synthetic-password"))){}
            AuthTokenResponse session;using(var r=await Request("User login",HttpMethod.Post,"/api/auth/login",200,new LoginRequest(Email(user),password))){session=(await r.Content.ReadFromJsonAsync<AuthTokenResponse>(json))!;}
            AuthTokenResponse adminSession;using(var r=await Request("Admin login",HttpMethod.Post,"/api/auth/login",200,new LoginRequest(Email(admin),password))){adminSession=(await r.Content.ReadFromJsonAsync<AuthTokenResponse>(json))!;}
            Program.Check(session.UserId==user&&session.Role=="User"&&adminSession.UserId==admin&&adminSession.Role=="Admin","real roles in auth response");
            AuthTokenResponse rotated;using(var r=await Request("refresh rotation",HttpMethod.Post,"/api/auth/refresh",200,new RefreshTokenRequest(session.RefreshToken))){rotated=(await r.Content.ReadFromJsonAsync<AuthTokenResponse>(json))!;}
            Program.Check(rotated.RefreshToken!=session.RefreshToken&&rotated.AccessToken!=session.AccessToken,"tokens rotated");
            var token=rotated.AccessToken;var adminToken=adminSession.AccessToken;
            using(await Request("refreshed JWT profile",HttpMethod.Get,"/api/profile",200,token:token)){}
            using(await Request("User admin forbidden",HttpMethod.Get,"/api/admin/packages",403,token:token)){}
            using(await Request("Admin package list",HttpMethod.Get,"/api/admin/packages",200,token:adminToken)){}
            using(await Request("invalid package no write",HttpMethod.Post,"/api/admin/packages",400,new CreateCreditPackageRequest("",0,-1,true),adminToken)){}
            using(await Request("invalid package update no write",HttpMethod.Put,$"/api/admin/packages/{package}",400,new UpdateCreditPackageRequest("",0,-1,true),adminToken)){}
            using(await Request("invalid answer mode",HttpMethod.Post,$"/api/projects/{project}/answer-rules",400,new UpsertAnswerRuleRequest(question,"unsupported","{}"),token)){}
            using(await Request("invalid answer JSON",HttpMethod.Post,$"/api/projects/{project}/answer-rules",400,new UpsertAnswerRuleRequest(question,"Fixed","{"),token)){}
            using(await Request("empty analyze local",HttpMethod.Post,"/api/forms/analyze",400,new AnalyzeFormRequest("","Synthetic"),token)){}
            using(await Request("invalid host analyze local",HttpMethod.Post,"/api/forms/analyze",400,new AnalyzeFormRequest("https://example.invalid/blocked","Synthetic"),token)){}
            using(await Request("owner project",HttpMethod.Get,$"/api/forms/{project}/questions",200,token:token)){}
            using(await Request("other account project privacy",HttpMethod.Get,$"/api/forms/{project}/questions",404,token:adminToken)){}
            using(await Request("owner order",HttpMethod.Get,$"/api/topup-orders/{order}",200,token:token)){}
            using(await Request("other account order privacy",HttpMethod.Get,$"/api/topup-orders/{order}",404,token:adminToken)){}
            using(var r=await Request("owner evidence blob",HttpMethod.Get,$"/api/topup-orders/evidence/{evidence}",200,token:token))
            {Program.Check((await r.Content.ReadAsByteArrayAsync()).SequenceEqual(bytes),"blob exact bytes");Program.Check(r.Headers.CacheControl?.NoStore==true&&r.Headers.GetValues("X-Content-Type-Options").Single()=="nosniff","blob safe headers");}
            using(await Request("other account evidence privacy",HttpMethod.Get,$"/api/topup-orders/evidence/{evidence}",404,token:adminToken)){}
            using(await Request("User admin evidence forbidden",HttpMethod.Get,$"/api/admin/topup-orders/evidence/{evidence}",403,token:token)){}
            using(await Request("Admin attached blob",HttpMethod.Get,$"/api/admin/topup-orders/evidence/{evidence}",200,token:adminToken)){}
            using(await Request("missing blob",HttpMethod.Get,$"/api/topup-orders/evidence/{Guid.NewGuid()}",404,token:token)){}
            using(await Request("old refresh rejected",HttpMethod.Post,"/api/auth/refresh",401,new RefreshTokenRequest(session.RefreshToken))){}
            await using var fresh=Program.Open();
            var usages=await fresh.UsageLogs.Where(x=>x.UserId==user).ToListAsync();var refresh=await fresh.RefreshTokens.Where(x=>x.UserId==user||x.UserId==admin).ToListAsync();
            Program.Check(usages.Count==2&&usages.All(x=>x.Status=="Failed"&&x.CreditsUsed==0),"independent SQL two zero-credit failed analyses");
            Program.Check(await fresh.FormProjects.CountAsync(x=>x.UserId==user)==1&&!await fresh.AnswerRules.AnyAsync(x=>x.ProjectId==project),"invalid requests no project/rule mutation");
            var persistedPackage=await fresh.CreditPackages.SingleAsync(x=>x.Id==package);Program.Check(persistedPackage.Name=="FAHERR HTTP synthetic"&&persistedPackage.Credits==1&&!persistedPackage.IsActive,"invalid package unchanged");
            Program.Check(refresh.Count==3&&refresh.Count(x=>x.RevokedAt!=null)==1,"independent SQL refresh rotation");
            Program.Check(!await fresh.CreditTransactions.AnyAsync(x=>x.UserId==user||x.UserId==admin)&&!await fresh.SubmissionJobs.AnyAsync(x=>x.ProjectId==project),"no credits/submissions");
            await Program.Write("api-verification.json",new{status="Verified",actualProgram=true,httpChecks=responses.Count,responses,user,admin,project,question,package,evidence,order,sql=new{usageIds=usages.Select(x=>x.Id),refreshRows=refresh.Count,revokedRows=refresh.Count(x=>x.RevokedAt!=null),ruleRows=0,creditTransactions=0},outbound="none: local validation/read/auth only",preservedFixtures=true});
            Console.WriteLine($"Verified actual Program HTTP {responses.Count} + independent SQL assertions.");return 0;
        }
        finally
        {
            if(!process.HasExited){process.Kill(entireProcessTree:true);await process.WaitForExitAsync();}
            string[] safe;lock(logs){safe=logs.Select(x=>x.Replace(signing,"[redacted]").Replace(password,"[redacted]")).ToArray();}
            await File.WriteAllLinesAsync("api-bounded.log",safe);
            await Program.Write("api-release.json",new{pid,exited=process.HasExited,exitCode=process.ExitCode,listenerRemaining=IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners().Any(x=>x.Port==5248),responses,utc=DateTimeOffset.UtcNow});
        }
    }
}
