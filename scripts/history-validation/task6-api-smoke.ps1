param([string]$SessionDirectory='.codex-tmp/fah-history-task6', [string]$Api='http://127.0.0.1:5305', [string]$Artifact='artifacts/reports/fah-history-001/task6-api-http.json')
$ErrorActionPreference='Stop'
if($Api -ne 'http://127.0.0.1:5305'){throw 'Task6 loopback target refused'}
$owner=Get-Content (Join-Path $SessionDirectory 'owner-session.json')|ConvertFrom-Json
$other=Get-Content (Join-Path $SessionDirectory 'other-session.json')|ConvertFrom-Json
$admin=Get-Content (Join-Path $SessionDirectory 'admin-session.json')|ConvertFrom-Json
$f=Get-Content (Join-Path $SessionDirectory 'fixture.json')|ConvertFrom-Json
$script:checks=[System.Collections.Generic.List[object]]::new()
function Check($name,$condition,$detail=$null){$script:checks.Add(@{name=$name;passed=[bool]$condition;detail=$detail}); if(!$condition){$script:checks|ConvertTo-Json -Depth 12|Set-Content -Encoding utf8 $Artifact; throw "Assertion failed: $name"}}
function Request($name,$method,$path,$expected,$session=$owner,$body=$null,$version=$true){
 $headers=@{};if($session){$headers.Authorization="Bearer $($session.accessToken)"}; if($version){$headers['X-FormAuto-Contract-Version']='2'}
 $args=@{Uri=$Api+$path;Method=$method;Headers=$headers;SkipHttpErrorCheck=$true}; if($null -ne $body){$args.ContentType='application/json';$args.Body=$body|ConvertTo-Json -Depth 8}
 $r=Invoke-WebRequest @args; $j=$null;$content=if($r.Content -is [byte[]]){[Text.Encoding]::UTF8.GetString($r.Content)}else{[string]$r.Content};if($content.TrimStart().StartsWith('{')){$j=$content|ConvertFrom-Json}
 Check $name ([int]$r.StatusCode -eq $expected) @{method=$method;path=$path;status=[int]$r.StatusCode;code=$j.code;cacheControl=[string]$r.Headers['Cache-Control']}
 return $j
}
$p=$f.projectId
Request 'health' GET '/health' 200 $null|Out-Null
Request 'anonymous history401' GET '/api/generation-history' 401 $null|Out-Null
Request 'anonymous generation401' POST "/api/projects/$p/responses/generate" 401 $null @{count=1}|Out-Null
Request 'user admin-only403' GET '/api/admin/ai-provider-settings' 403|Out-Null
Request 'admin config200' GET '/api/admin/ai-provider-settings' 200 $admin|Out-Null
Request 'old rules client409' POST "/api/projects/$p/responses/generate" 409 $owner @{count=1} $false|Out-Null
Request 'other owner before version404' POST "/api/projects/$p/responses/generate" 404 $other @{count=1} $false|Out-Null
Request 'admin has no ownership404' POST "/api/projects/$p/ai-responses/generate" 404 $admin @{mode='Option2';count=1}|Out-Null
$initial=Request 'initial dashboard' GET '/api/dashboard/summary' 200
Check 'initial credits5' ($initial.currentCreditBalance -eq 5 -and $initial.reservedCreditBalance -eq 0 -and $initial.availableCreditBalance -eq 5)
$rules=Request 'rules100' POST "/api/projects/$p/responses/generate" 200 $owner @{count=100}
Check 'rules100 free' ($rules.items.Count -eq 100 -and $rules.creditsUsed -eq 0 -and $rules.generationFeePerResponse -eq 0 -and $rules.credits.balance -eq 5)
$batch=$rules.generationBatchId; $response=$rules.items[0].id
$detail=Request 'history detail100' GET "/api/generation-history/$batch" 200
Check 'detail immutable100 observed Partial' ($detail.responses.Count -eq 100 -and $detail.observation.completeness -eq 'Partial' -and @($detail.responses|Where-Object {!$_.sendBlocked}).Count -eq 0)
Request 'wrong-owner detail404' GET "/api/generation-history/$batch" 404 $other|Out-Null
Request 'admin detail404' GET "/api/generation-history/$batch" 404 $admin|Out-Null
$request=@{contractVersion=2;commandId=[guid]::NewGuid().ToString();batchId=$batch;responseIds=@($response);confirmed=$true;duplicateWarningAccepted=$true}
$blocked=Request 'production selected-send failclosed409' POST "/api/projects/$p/submissions/send" 409 $owner $request
Check 'production evidence fence' ($blocked.code -eq 'FormEvidenceUnavailable')
Request 'production rules-direct failclosed409' POST "/api/projects/$p/submissions/send-rules-direct" 409 $owner @{contractVersion=2;commandId=[guid]::NewGuid().ToString();count=1}|Out-Null
Request 'wrong-owner send404' POST "/api/projects/$p/submissions/send" 404 $other $request|Out-Null
Request 'old send client409' POST "/api/projects/$p/submissions/send" 409 $owner ($request+@{}|ForEach-Object {$_.contractVersion=1;$_})|Out-Null
Request 'invalid count101' POST "/api/projects/$p/ai-responses/generate" 400 $owner @{mode='Option2';count=101}|Out-Null
$ai1=Request 'deterministic AI default3' POST "/api/projects/$p/ai-responses/generate" 200 $owner @{mode='Option2';count=3}
Check 'default price1 actual3' ($ai1.generatedCount -eq 3 -and $ai1.creditsUsed -eq 3 -and $ai1.generationFeePerResponse -eq 1 -and $ai1.credits.balance -eq 2)
$ai2=Request 'deterministic AI custom partial' POST "/api/projects/$p/ai-responses/generate" 200 $owner @{mode='Option3';count=2}
Check 'custom price2 partial1' ($ai2.generatedCount -eq 1 -and $ai2.creditsUsed -eq 2 -and $ai2.missingCredits -eq 2 -and $ai2.credits.balance -eq 0)
$zero=Request 'zero available AI no output' POST "/api/projects/$p/ai-responses/generate" 200 $owner @{mode='Option2';count=1}
Check 'zero output no batch debit' ($zero.generatedCount -eq 0 -and $zero.creditsUsed -eq 0 -and $null -eq $zero.generationBatchId)
for($i=0;$i -lt 19;$i++){Request "free retention run$i" POST "/api/projects/$p/responses/generate" 200 $owner @{count=1}|Out-Null}
$list=Request 'paginated20 first10' GET '/api/generation-history?page=1&pageSize=10' 200
Check '20 newest ten per page' ($list.totalItems -eq 20 -and $list.totalPages -eq 2 -and $list.items.Count -eq 10)
$page2=Request 'page2' GET '/api/generation-history?page=2&pageSize=10' 200
Check 'disjoint page membership' (@($list.items.batchId|Where-Object {$_ -in $page2.items.batchId}).Count -eq 0 -and $page2.items.Count -eq 10)
Request 'invalid pagination400' GET '/api/generation-history?page=0' 400|Out-Null
Request 'expired batch404' GET "/api/generation-history/$batch" 404|Out-Null
Request 'expired recovery404' GET "/api/projects/$p/responses?ids=$response" 404|Out-Null
$request.contractVersion=2
$expired=Request 'expired send409' POST "/api/projects/$p/submissions/send" 409 $owner $request
Check 'expired fence' ($expired.code -eq 'HistoryExpired')
$otherList=Request 'other owner empty history' GET '/api/generation-history' 200 $other
$adminList=Request 'admin empty history' GET '/api/generation-history' 200 $admin
Check 'roles isolated lists' ($otherList.totalItems -eq 0 -and $adminList.totalItems -eq 0)
$post=Request 'final dashboard' GET '/api/dashboard/summary' 200
Check 'posted reserved available totals' ($post.currentCreditBalance -eq 0 -and $post.reservedCreditBalance -eq 0 -and $post.availableCreditBalance -eq 0 -and $post.totalCreditsUsed -eq 5)
$f|Add-Member -NotePropertyName expiredBatchId -NotePropertyValue $batch -Force
$f|Add-Member -NotePropertyName aiDefaultBatchId -NotePropertyValue $ai1.generationBatchId -Force
$f|Add-Member -NotePropertyName aiCustomBatchId -NotePropertyValue $ai2.generationBatchId -Force
$f|Add-Member -NotePropertyName currentBatchId -NotePropertyValue $list.items[0].batchId -Force
$f|ConvertTo-Json|Set-Content -Encoding utf8 (Join-Path $SessionDirectory 'fixture.json')
@{target=$Api;mode='ordinary production-config API; Deterministic AI; Google fail-closed';at=(Get-Date).ToString('o');checks=$script:checks;users=@($owner.userId,$other.userId,$admin.userId);projectId=$p;oldBatch=$batch;defaultAI=$ai1;customAI=$ai2;zeroAI=$zero}|ConvertTo-Json -Depth 12|Set-Content -Encoding utf8 $Artifact
"$($script:checks.Count) assertions passed; $Artifact"
