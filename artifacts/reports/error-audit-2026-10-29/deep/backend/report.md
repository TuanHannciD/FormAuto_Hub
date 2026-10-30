# Rà sâu backend FAH-ERR-001

Ngày 2026-10-29; snapshot nguồn HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Agent `gpt-6.1-sol`, reasoning `high`, không agent con. Chỉ audit/evidence, không sửa production hoặc tests repository. Báo cáo dùng systematic-debugging và verification-before-completion.

## Kết quả chính

ERR-008/009 có tái hiện bằng lời gọi implementation thật với fake provider/InMemory/logger thay cho kiểm thứ tự text. **ERR-012 cần sửa nội dung**: malformed JSON được service phân biệt và giữ inner exception; chỉ cấu hình JSON hợp lệ nhưng sai shape/constraint bị gộp. Không có sự cố production, SQL hay provider thật nào được xác nhận.

`Harness.cs` gọi API assembly build mới từ nguồn hiện tại qua `source-build/SourceAudit.csproj`; project này sao package references API, chỉ rõ compile source API và loại obj/bin. Dùng assets/packages đã có; `--no-restore`. Không chạy Program/Main của API, không mở listener, không dùng config/secret repository. Runtime dependencies lấy từ thư mục output tests đã có. `run.ps1` build, compile harness và chạy; `results.json` có 16 observations thuộc 10 nhóm probe. Passing nghĩa là tái hiện hành vi hiện tại, không phải lỗi đã sửa.

Lần thử build original project với intermediate/output chuyển sang artifact bị duplicate assembly attributes vì obj gốc bị glob; ghi `build-output*.txt`, **Failed**, là lỗi cách dựng harness, không quy thành lỗi sản phẩm. Sau đó explicit-source artifact project build **Verified**, một cảnh báo NU1603 (Forms v1 cached 1.69.0.3673 thay 1.69.0). Harness compile có CS1701 runtime8→9 EF reference, CS2023 noconfig, CS9113 unused fake parameter; execution .NET9 exit0. Không restore hoặc sửa csproj gốc.

## Findings và disposition

### BE-001 — P1, Confirm ERR-008: submit thành công ở fake external nhưng không còn bằng chứng durable khi lần tiếp theo throw

- Nguồn: `src/FormAutoHub.Api/Services/SubmissionService.cs`, `SendAsync`: save Running dòng111; external call139; add log141–164; save batch167; finalization175–193. `SubmissionsController.Send` chỉ bắt InvalidOperationException dòng27. `GoogleFormsClient.SubmitAsync` có thể throw HttpRequestException/timeout từ HttpClient.
- Trigger tái hiện: hai preview hợp lệ, Confirmed=true; fake client call1 trả Success; call2 throw `HttpRequestException("Synthetic interrupted transport")`. Không có HTTP ra mạng.
- **BE-P01 Verified**: fake ghi nhận attemptedCalls2/externalSuccesses1. Dispose write context rồi đọc context mới cùng InMemory store: job `Running`, SuccessCount0, SubmissionLogs0, UsageLogs0, cả hai response `Previewed`. Exception thoát service.
- Mong đợi audit: biết chính xác phần đã xác nhận và phần chưa biết, giữ cause cùng project/job/response hiện có để điều tra; không mô tả operation đã rollback an toàn. Hiện tại state không phản ánh external success đã biết trong process; active Running còn chặn Send sau đó. Không khẳng định gửi trùng đã xảy ra hay policy retry đã được duyệt.
- Cùng nhóm, **BE-P02 Verified**: PayloadJson=`{` sau Running save → `InvalidOperationException("Generated response payload is invalid.")`, InnerException=null, fresh context job vẫn Running; UsageLog giữ thông báo nhưng mất JsonException/path/position. Khác với AnswerRuleService có giữ inner.
- Cùng nhóm NCKH, **BE-P04 Verified**: model thuộc user, linked login có response-read scope, fake access token; ListResponsesAsync throw HttpRequestException → fresh context DataCollectionLogs0/SurveyResponses0. Log Add ở `ResearchDataService.CollectResponsesAsync` dòng40 chưa save trước I/O71; null-return path có CompleteFailedCollectAsync350–352 nhưng thrown path bỏ qua nó.
- Phần create remote form rồi create questions/reimport fail vẫn **static**, `ResearchFormService.CreateGeneratedFormAsync` lưu local sau toàn bộ calls. Không tái hiện nhánh này trong harness.
- Đề xuất Deferred: trước hết bảo toàn exception chain + IDs/context an toàn và phân biệt outcome đã biết/chưa biết; review persistence/recovery policy trước đổi save/transaction/state. Test phải đọc context mới sau fail tại call1/call2, cancellation, save fail và batch boundary; kiểm SQL Server riêng. Không tự resend.

### BE-002 — P1, Confirm ERR-009: raw AI payload được logger nhận ở Information

- Nguồn `Integrations/AI/OpenAiCompatibleProviderAdapter.cs:39` và50, `GenerateAsync`; BuildPayload đưa PromptSnapshotJson/QuestionSnapshotJson vào user content. Logger template không có RunId/batch; request record có ProjectId nhưng rawRequest object không đưa trường này vào root.
- Trigger fake HTTP503 với synthetic marker trong prompt và response. **BE-P05 Verified**: hai entries đều Information, chứa cả prompt marker và response marker; API key synthetic chỉ nằm Authorization và **không** nằm logs. Thrown message chỉ `AI provider returned HTTP 503.`
- Mong đợi: diagnostics tối thiểu, an toàn, có operation context; hiện log sink nhận toàn payload ngay ở luồng bình thường, bao gồm nội dung người dùng có thể nhập. Chưa chứng minh sink lưu lâu, người nào truy cập, hay secret thật đã lộ. P1 vì đường mặc định thường xuyên đưa user content sang log; đây là exposure risk được fake tái hiện, không incident thật.
- Deferred: dùng metadata bounded/redacted và context hiện có; content retention/access cần quyết định riêng. Test capture sink với synthetic personal/token-like text, dữ liệu lớn, parallel calls; kiểm log level configuration runtime riêng.

### BE-003 — P2, Confirm ERR-007: history ghi thành công cho job Failed

- `Services/SubmissionService.cs:179` `WriteUsageLogAsync` chọn Failed cho job khác Completed nhưng description dòng184 cố định `Gửi form thành công`.
- **BE-P03 Verified**: fake Submit trả false/error HTTP503; fresh context job Failed, UsageLog.Status Failed, Description `Gửi form thành công`. Không pause/cancel thật trong probe, các nhánh này chỉ static.
- Mong đợi description phù hợp outcome/count; hiện lịch sử mâu thuẫn status. Đề xuất Deferred: wording theo status hiện có, giữ nguyên lịch sử trừ khi có quyết định riêng; test failed/mixed/paused/cancelled và UI history.

### BE-004 — P2, Revise ERR-012: parse syntax giữ cause; constraint mới bị gộp

- `Services/AnswerRuleService.ValidateRequest`: dòng127–134 parse trước và throw `ConfigJson must be valid JSON.` với JsonException làm inner; HasValidConfig được gọi146 sau đó, generic throw148. Helper catch JsonException/InvalidOperationException riêng không đủ chứng minh malformed JSON tới generic branch.
- **BE-P08 Verified qua service CreateAsync thật**, question thuộc project/user: syntax `{` → message riêng, inner JsonReaderException; `weights.A=-1` và `weights.A=101` → cùng `Answer rule config does not match the selected mode and question.`, inner=null. Các rule modes khác chưa fault-inject.
- Hiện syntax error vẫn jargon tiếng Anh ở HTTP detail; nhưng không được ghi là nguyên nhân parse đã mất tại service. Controller AnswerRules bắt InvalidOperationException và chỉ gửi message; không có structured log tại catch, nên inner tồn tại trong object không đồng nghĩa đã được ghi diagnostics.
- Deferred: giữ cause/constraint cụ thể an toàn để người dùng biết sửa tỷ lệ/số lượng/phạm vi; không ghi ConfigJson raw. Test syntax/type/constraint độc lập qua service, controller và browser.

### BE-005 — P2, Confirm ERR-013 tại controller; HTTP vẫn Not run

- `Services/PackageService.ValidatePackageInput:105` throw ArgumentException; `Controllers/AdminPackagesController.CreatePackage:48` await service không catch; Update tương tự. DTO record Phase2 không có range attribute tương ứng. Program không có application exception mapper explicit.
- **BE-P07 Verified** gọi actual controller/service với admin fake, name hợp lệ, credits1, price0: ArgumentException thoát action, message `Giá gói phải lớn hơn 0. (Parameter 'price')`, PackageRows0.
- Mong đợi lỗi input là validation hữu ích; hiện không có ActionResult được controller trả. **Không khẳng định HTTP body/trace cụ thể**, vì MVC/middleware thật chưa chạy; environment có thể đổi output.
- Deferred: map known validation tại boundary phù hợp contract hiện có; test HTTP/browser price/credit/name và unexpected exception, không mặc định chuẩn hóa toàn app sang ProblemDetails.

### BE-006 — P2, Confirm ERR-006 boundary; UI end-to-end static

- `Services/PayosClient.cs:38` raw responseText vào ErrorMessage; `PaymentService.CreatePayosTopupOrderAsync:68` chuyển tiếp; `PaymentsController.CreatePayosTopupOrder:22` trả Conflict cho các false result.
- **BE-P09 Verified** fake503 body `SYNTHETIC_PROVIDER_DETAIL` → Failed ErrorMessage `PayOS trả HTTP 503: SYNTHETIC_PROVIDER_DETAIL`. Chưa gọi payment service/HTTP/browser trong probe; forwarding chain đọc nguồn hoàn chỉnh.
- Mong đợi UI wording có ích và provider cause an toàn được giữ nội bộ; hiện provider body có đường tới HTTP409/UI. Không leak secret thật được tái hiện. Deferred: sanitize/bound metadata, giữ failure identity nội bộ, review status/contract trước đổi; test malformed200/non2xx/timeout và browser console.

### BE-007 — P2, Confirm ERR-010 collapse nhưng không gộp mọi exception vào null

- `Integrations/Google/GoogleFormsApiService.GetFormStructureAsync:63–71`: non2xx/missing formId thành null. **BE-P10 Verified** fake403/404/429/503 cùng null. CreateForm/ListResponses non2xx và CreateQuestions bool tương tự là static.
- `GoogleOAuthService.ExchangeCodeAsync/RefreshAccessTokenAsync` thiếu config, non2xx, thiếu access token thành null; `GetValidAccessTokenAsync` tiếp tục null. Không logger nhận status/provider request context tại các branch này. Core GoogleIdentityVerifier null phải giữ generic credential UI; chẩn đoán config là vấn đề nội bộ.
- Correction về phạm vi: transport errors và malformed JSON có thể **throw**, không bị các null guard này nuốt; NCKH thrown collection là BE-001, không finding mới trùng.
- Mong đợi phân biệt unavailable/rate-limit/access nội bộ để UI không quy nhầm token expired/not found. Deferred: typed safe cause nội bộ, preserving Google-vs-JWT contract; test OAuth config/token/provider status/transport/malformed responses. Không gọi ExchangeCode success vì implementation tạo HttpClient riêng cho userinfo và sẽ ra mạng thật.

### BE-008 — P2, Confirm/clarify ERR-011: lý do có trong entity, không trong response; parse envelope khác parse output

- `Services/AiGenerationService.GenerateAsync:190–206` catch Task.WhenAll: chỉ exception.Message ghép vào ErrorMessage và generic UsageLog, không ILogger exception/stack hoặc per-batch failure. `ToResponse:553` không projection ErrorMessage; analytics recent/admin run cũng bỏ trường. Existing RunId được trả, nên không nói không có correlation ID nào.
- **BE-P06 Verified ở adapter**: HTTP200 malformed outer JSON `{bad` → JsonReaderException; outer envelope hợp lệ nhưng assistant content `{bad` → OutputJsons0. Không được nói mọi malformed output trở thành empty; parse location quyết định throw hay empty. Service catch generic/provider-failed bao phủ JsonReaderException, còn outputs0 thành failed validation/no-outputs; propagation này static.
- Không coi cả hai malformed cases là hai finding mới; là refinement của ERR-011. Những cause khác (guard/credit/timeout/provider) có branch riêng trong run nhưng UI nhận cùng Failed projection. Run JSON raw success lưu DB là thiết kế hiện tại; không tự suy ra retention vi phạm.
- Deferred: safe cause-specific guidance trên contract sau review, diagnostics có existing run/project/batch context và exception chain; fake parallel sibling fail/timeout, guard/output failure, verify ledger riêng.

### BE-009 — P2, Confirm ERR-005/019 phần backend; tránh mất chi tiết nội bộ

- Đọc `FormProjectService.AnalyzeAsync` full: wrap exception giữ inner (`throw new InvalidOperationException(exception.Message, exception)`), cùng message ghi UsageLog rồi controller detail. Không báo mất chain tại service này. Phần UI/history tiếng Anh của ERR005 được static confirm; probe mới không cần nhân bản.
- `AiProviderSettingsService.CheckAsync/EvaluateConfiguration` message tiếng Anh như `Missing configuration: provider, API key, and default model.` và `AI provider configuration has the required local settings.`; đây là local configuration check, không kiểm live connectivity. `Check` wording không nên khiến admin tin đã gọi provider; scope contract hiện tại cần giữ.
- `ArgumentException` suffix `Parameter 'price'` được BE-P07 xác nhận tại throw, chưa chứng minh suffix tới browser ở package (action chưa translate). Với settings controller có catch và trả message thì chain tồn tại bằng static.
- Mong đợi plain Vietnamese theo vai trò; giữ technical validation có ích trong diagnostics, không ép dịch mọi internal AiOutputValidationError. Deferred: catalog wording theo consumer thực tế, browser admin check/callback/history. Không đổi status/contract/schema.

## Mở rộng ERR-015 do UI agent yêu cầu đối chiếu

Backend **static confirm** POST AI success đã có side effects trước response: `AiGenerationService.GenerateAsync` Add generatedResponses330; gọi dedicated creditService332–339 (CreditService.DeductUsageCreditsAsync thêm CreditTransactions và đổi account); run complete363–367, UsageLog369–373, SaveChanges374, rồi return ToResponse376–381 gồm RunId/generated IDs/credits/balance. Existing `AiGenerationServiceTests.GenerateAsync_Option2WritesPreviewsCreditUsageAndAudit` kiểm các invariants cùng context, không phải fresh SQL/browser. Vì vậy GET responses thất bại sau POST200 trong UI không chứng minh generate/debit thất bại; retry POST là thao tác mới có thể tiếp tục tốn credit. **Không khẳng định double debit đã xảy ra**. Nên gộp vào ERR015 cùng lỗi mutation+reload, không tăng số nhóm do mỗi consumer.

## Phạm vi đã đọc và giới hạn

Đã đọc hoàn chỉnh các units trọng tâm: SubmissionService/Controller; GoogleFormsClient/models; ResearchDataService và tests NckhPhase5; GoogleOAuthService/GoogleFormsApiService; AI adapter/tests, AiGenerationService, AiAnalyticsService; PackageService/AdminPackagesController; AnswerRuleService/helper/Controller; PayosClient/PaymentService/Controller/Signature; AuthService/CreditService; FormProjectService; AiProviderSettingsService. ResearchFormService chỉ sections GenerateForm/CreateGeneratedForm/UpdateExisting và related generation tests, không coi toàn file đã review. Entrypoints/docs/task/contracts error rules đã đọc. Không tự nhận mọi source backend hoặc mọi NCKH branch đã rà thủ công.

| ERR cũ | Disposition | Evidence mới / giới hạn |
| --- | --- | --- |
| ERR-005 | Confirm | Static full service preserves inner; English UsageLog/UI chain giữ nguyên |
| ERR-006 | Confirm | Fake HTTP boundary BE-P09, forwarding controller static |
| ERR-007 | Confirm | Fresh InMemory BE-P03; pause/cancel static |
| ERR-008 | Confirm + strengthen | Fresh InMemory BE-P01/P02/P04; remote creation static; SQL/live Not run |
| ERR-009 | Confirm + strengthen | Actual logger capture BE-P05; key excluded; no real leak incident |
| ERR-010 | Confirm + narrow | Fake 403/404/429/503 BE-P10; transport/malformed may throw |
| ERR-011 | Confirm + clarify | Adapter BE-P06; entity/DTO/analytics static; run ID exists |
| ERR-012 | **Revise** | BE-P08 disproves syntax cause-loss/generic claim; retain constraint collapse |
| ERR-013 | Confirm, HTTP Not run | Actual controller BE-P07, no ActionResult; exact HTTP environment-dependent |
| ERR-019 | Confirm phần backend | Role/context wording static; không gom internal detailed validator thành UI defect |
| ERR-015 AI extension | Duplicate/shared group | Save/debit trước return static; consumer execution thuộc UI agent |
| NEW | Không thêm nhóm độc lập | Những phát hiện mới ở trên là refinement/evidence cho nhóm hiện có |

## Validation và handoff

- **Verified:** artifact source build; harness compile; `powershell -NoProfile -File artifacts/reports/error-audit-2026-10-29/deep/backend/run.ps1`, exit0, 16 observations. Output/hash files đặt cạnh report; không secret thật hoặc raw user data.
- **Failed:** hai cách build chuyển obj ban đầu, giữ log minh bạch; đã khắc phục bằng explicit-source artifact project. Đây không phải product fix.
- **Not run:** API/MVC status/body/model binding, browser, SQL Server transactions/persistence/migrations, real Google/PayOS/AI, parallel-batch exceptions/log sink retention. Do runtime agent sở hữu và không có quyền live side effects; không chuyển mock thành end-to-end Verified.
- **Files changed:** chỉ thư mục `artifacts/reports/error-audit-2026-10-29/deep/backend/`: report/harness/runner/results/hash/build artifacts. Không tracked source/test/docs chỉnh sửa, không commit/push/deploy/install/cleanup. Không resource listener/browser/DB cần release.
- **Scope alignment:** audit-only đúng FAH-ERR-001; không invent error code/state/ProblemDetails contract. NCKH giữ track riêng; auth generic credential protection được giữ.
- **Risks/Deferred:** mọi remediation, persistence/recovery/privacy/contract decisions còn Deferred. SQL/provider/runtime và independent review chưa có trong agent này.
- **Next recommended step:** reviewer độc lập đối chiếu source+runner, nhất là correction ERR012 và giới hạn mock; sau đó root tổng hợp và đề xuất remediation riêng có contract/risk review. Chưa đủ chứng nhận full-system audit Done hay integration/release.
