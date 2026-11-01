# SDD ledger — plan: docs/ai/tasks/FAH-UI-002/INDEX.md

## Baseline thực thi

- Plan và điều phối nhiều agent được duyệt ngày 2026-10-28. Điều kiện tài liệu hoàn tất tại `be3c65baa79e55799e2b17a3a0b0edd7bc5cfa94`, đã sync `origin/docs/pre-ui-refinement-20261028`; ahead/behind 0/0, sạch trước khi tạo bằng chứng.
- Nhánh triển khai: `ui/compact-refinement-20261028`, cùng checkout với quyền ghi file độc quyền theo plan. Bản ghi không cấp quyền commit/push/merge/deploy tiếp.
- Chỉ một checkout; không có đăng ký worktree thừa. Giữ các nhánh lịch sử và toàn bộ bằng chứng local.
- Baseline: `artifacts/reports/ui-refinement-2026-10-28/baseline/source-manifest.json`, 138 file frontend nguyên bản kèm bytes và SHA-256. Status lấy sau khi tạo có bằng chứng mới; trạng thái sạch trước đó được ghi riêng.
- Runtime `/root/local_app`: web 3020 / API 7039, identity và HTTP health Verified tại `runtime-check.json`. DB cấu hình localhost/FormAutoHub; không đổi schema. Quyền runtime/build/test độc quyền.
- Session User, workspace NCKH đã import và callback provider thành công: Blocked đến khi có điều kiện hiện hữu được phép dùng. Fixture không xác minh được các trạng thái thật này.
- Bằng chứng thô giữ local; kiểm tra riêng tư trước khi công bố. Không in thông tin đăng nhập hoặc token.

## Kiểm tra phụ thuộc trước thực thi

| Task | Quan hệ tạo / dùng hoặc tính nhất quán nội bộ | Kết quả |
| --- | --- | --- |
| 0 → 1–5 | Bytes gốc, runtime identity, coverage route | Đã ghi baseline/runtime; điền coverage trước khi sửa page. |
| 1 → 2 B/C/D | Shell, primitive, token dùng chung được page sử dụng | Review nền tuần tự; đóng băng file chung khi sửa page. |
| 1 A → 2 D | Consumer shadow homepage / tinh chỉnh public sau đó | A chỉ sửa consumer shadow; bàn giao rõ trước khi D ghi. |
| 2 B ↔ 2 C ↔ 2 D | Cây page riêng, style chung chỉ đọc | Quyền ghi tách biệt; không sửa chung hoặc ghi runtime test đồng thời. |
| 1–2 → 3–4 | Hash code và bằng chứng ổn định / review độc lập | Không sửa phạm vi đang review; task review mới mỗi vòng. |
| 3 ↔ runtime | Build/test và dev dùng chung `.next` | Dừng dev sở hữu trước regression/build, khởi động lại để smoke thật. |
| 0 | Target an toàn và bằng chứng nguyên bản | Không cần reset/seed DB hay thao tác provider. |
| 1 | Regression shadow, hình học nền gọn, hành vi popup | Test style/hình học thực; fixture motion/dialog tùy file thay đổi. |
| 2 | Nội dung page gọn với workflow giữ nguyên | Tách gate hình học top-up/history/auth bắt buộc khỏi khuyến nghị. |
| 3 | Regression và xác minh runtime thật | Ghi riêng bằng chứng mock và live. |
| 4 | Sửa và review độc lập lại | Tiếp tục đến khi đạt; thiếu điều kiện thật vẫn Blocked. |
| 5 | Gallery và bàn giao song ngữ | Hoàn tất local không đồng nghĩa tích hợp/phát hành. |

## Trạng thái task và ownership

- Task 0: đang làm; baseline/runtime Verified; coverage matrix Verified: 29 route duy nhất, 63 ảnh route + 4 ảnh trạng thái shared tham chiếu baseline, toàn bộ after Not run.
- Task 1: đã giao `/root/foundation_a`, chỉ định `gpt-6.1-sol` / `high`; manifest độc quyền tại `artifacts/reports/ui-refinement-2026-10-28/foundation-brief.md`. Không có người ghi sản phẩm khác.
- Task1–4: đã triển khai UI và review độc lập; check runtime/re-review test cuối theo phần dưới. Task5: bàn giao local; toàn app Done vẫn Blocked.
- Root sở hữu dossier song ngữ và điều phối bằng chứng; không sửa code sản phẩm.
- Agent browser dùng tab riêng và truyền tabId. Chỉ agent runtime điều khiển tiến trình sở hữu.

## Review và findings

- Plan vòng 1: đã sửa bốn findings; vòng 2 sẵn sàng duyệt; người dùng đã duyệt. Đã review triển khai; báo cáo cuối tại phần dưới.
- Hiện tại: UI đã triển khai và review độc lập chấp nhận; bằng chứng/bàn giao cuối tại phần dưới.

## Model policy — 2026-10-28

- Áp dụng ngay chỉ dẫn người dùng: mọi agent con chỉ dùng Sol, tối đa `gpt-6.1-sol` / `high`; cấm Astra, không ngoại lệ fallback/escalation/review cuối. Agent coverage hiện có dùng `gpt-6.1-sol` / kế thừa `medium`, hợp lệ; mọi dispatch sau chỉ định rõ cả hai.

- Đã thông báo trần model cho agent runtime/coverage; coverage tiếp tục bằng cấu hình Sol/medium hiện có. Đã hỏi điều kiện trạng thái thật còn thiếu; tiếp tục phần độc lập.

- Model policy independent reviewer `/root/model_policy_review`: explicit `gpt-6.1-sol` / `medium`, read-only scoped docs; review pending.

- Kiểm cấu hình agent hiện có: local_app, docs_sync_review, ui_plan_review và ui_plan_rereview được tạo full-history kế thừa root runtime (`gpt-6.1-sol`, reasoning `medium`), không override riêng. Đã thông báo trần cứng ngay cho tất cả. Coverage chỉ định Sol/kế thừa medium; foundation chỉ định Sol/high; reviewer policy chỉ định Sol/medium. Không dispatch agent Astra. Agent hoàn tất giữ idle; agent mới phải chỉ định model/effort hợp lệ.

- Người dùng cung cấp điều kiện User và đã xác minh: login 200 role User, danh sách NCKH 200 có 7 form đã import, mở một workspace hiện hữu tại laptop/mobile không overflow tài liệu. Bổ sung 12 ảnh local trong user-baseline/manifest.json. Đã gỡ blocker khả dụng User/NCKH; nghiệm thu đầy đủ workflow/state vẫn Not run. Không lưu credential trong dossier/evidence; không import/link/generate/submit.

- Re-review policy model ADDRESSED: không còn finding mở; bằng chứng tại model-policy-review.md. Runtime xác nhận Sol/medium khi bàn giao lease. Lease test A: đã dừng web3020 sở hữu, next3000 launcher6012/listener32416 HTTP200, API4940 Healthy200; runtime-ownership.json. Root chụp xong baseline User bổ sung trước khi sửa production.

- Local exclude giữ artifact refinement (ảnh, snapshot source gốc, trace, log) và không công bố. Bằng chứng RED tập trung: ba fail đúng kỳ vọng (shadow đặc, shell quá cao, target mobile40px), một case lịch sử thuộc page tạm skip chờ B; không claim gate lịch sử pass.

- Agent nền báo GREEN tập trung 3 pass / 1 fixme lịch sử thuộc page và shared/account16/16; chờ xác minh/review độc lập. Runtime chuyển test3000 sang dialog3001 cô lập khi A build source; cần xác nhận process/HTTP trước test/build. Detector UI cơ học dành một lần cho UI tích hợp đã sửa xong, không chạy từng worker.

- Runtime sau build Verified: web3020 launcher25120/Next7784; dialog3001 cô lập launcher9736/Next27292; API4940 healthy;3000 đã dừng. Cảnh báo Tailwind fixture đã xử lý trong config artifact riêng. Đã đọc log lint/build/auth9pass, GREEN3/history1skip và shared/account16pass của nền. Dialog lần đầu3pass/1fail assertion trạng thái cuối chuyển động popup cao; A đang chẩn đoán có hệ thống trước review, giữ bằng chứng fail. Chưa claim nền hoàn tất.

- Đóng băng production/test task1:10file sản phẩm + ui-refinement.spec.ts mới; snapshot root foundation-review-manifest-r1.json và diff đủ foundation-review-package-r1.diff. Đã giao reviewer code độc lập /root/foundation_code_review_r1 chỉ định Sol/high; bằng chứng đang hoàn tất. Chẩn đoán dialog fail: stylesheet fixture thiếu utility overflow/layout dù probe Tailwind riêng sinh đúng; distDir fixture mới cô lập cache, không xóa evidence.

- Bằng chứng ảnh đã có: foundation/gallery.html13cặp, geometry responsive12mẫu320–1920, live7GETAPI200+8asset200/không pageerror. Giao reviewer thị giác độc lập /root/foundation_visual_review_r1 chỉ định Sol/high trên cùng snapshot11file đã đóng băng. Sau sửa first-record lịch sử y940/916 và payment topup rect top1620/bottom1664 vẫn Failed gate fold cuối, giao B; nền không claim các gate đó pass.

- Review code nền R1 With fixes: P2 controlStyles sm:min-h-10 ghi đè min-h-24 của Textarea và minimum tùy chỉnh consumer tại>=640px; computed desktop40px thay96px.11/11hash đóng băng khớp. Batch sửa chờ verdict thị giác; dialogfixture chờ xác nhận owner an toàn. Followup runtime ban đầu bị từ chối do đầy slot; reviewer code kết thúc, giao lại runtime một lần, không thao tác process trùng.

- Đã gỡ gate dialog: dialog-final.log4/4passed11.1s trên product/spec đóng băng không đổi, sau runtime xác minh listenerfixture9952child9736 và utility đã nạp. Giữ log/trace fail3/1gốc. LogAPI/web giới hạn sạch. Nền vẫn Withfixes chờ textareaP2 và verdict thị giác; A idle, không writer test/build.

- Giao vòng sửa1 task1 cho A gốc Sol/high, cung cấp nguyên hai report review qua đường dẫn. F-CODE-01 minimumtextarea + V3 clipping/touchGoogle320 hiện hữu + V4 wordingrect report. Root giao rõ sharedgoogle-identity-button.tsx cho A; B/D chỉ đọc sau đó. V1/V2 vẫn Failed gate cuối của B. Giữ callbackprovider/không clickGooglethật. Cần code/visualre-review độc lập mới trên snapshot sửa; không tự skip/exempt gate.

- Ruling: cho A kiểm chứng nhãn Google signin ngắn chính thức chỉ trong container hẹp, option native hỗ trợ, scale đồng đều1.1thành44px kèm bùwidth/ResizeObserver; giữ callback/authnative, không overlay/nútgiả. Lý do: native min-content297.9px vượtpopup246px, size large chínhthức40px. Nếu sai: rủi ro branding/khả năngđọc/focus/renderloop; cần referencechínhthức, mockcallback/geometry, sốđolive native và re-reviewđộc lập trước nghiệmthu. Không ngầm xin ngoại lệ gate44px.

- Agent vòngsửa1 báo RED2→GREEN2; root đã đọc log covering21pass/1historyfixme và dialog4pass. Googlelive320 actual245.30x44 trongcontainer246px; textarea96/112/64 tại320/390/640/768/1366. Lint/colors/typecheck đạt, vẫn cần buildtíchhợpcuối saupage. Đã yêu cầu runtimerestart3020 để smoke snapshot sửa. Production/test chờfreeze; tiếp theo reviewmới.

- ĐóngbăngR2 vòngsửa1task1:12file/11production+test, root xácminh12hash. Reviewerđộc lậpmới /root/foundation_code_rereview_r2 và /root/foundation_visual_rereview_r2 chỉđịnhSol/high, không sửa sourcekhi review. Đã cungcấp diffpackage foundation-fix-review-package-r2.diff, fixreport/findingscũ. V4đãsửa; F-CODE-01/V3đãtriểnkhai chờverdictđộclập. Đãgiao riêng runtimelogtriage sausmoke; gateB/C/Dchưa mở.

- Task1 hoàn tất nền nội bộ: F-CODE-01,V3,V4được code/visualR2mới xácnhậnADDRESSED;12hashkhớp. Reviewer thịgiác Verifiedtrựctiếp Tab/focusoutlineGooglevàgiữfocus320/390/1366. V1/V2vẫnFailedgatecuốiB. Rootbàngiao homepageconsumerA→D, casehistoryui-refinementriêngA→B, sharedfoundationđóngbăng. Giao task2B/C/Dsol/highphạmvitáchbiệt; lease runtime/build/testtuầntự, khôngtựcommit/pháthành.

- Task2 đang chạy tách biệt: /root/dashboard_b,/root/admin_c,/root/public_d, mỗi agent chỉ định gpt-6.1-sol/high. Sharedbaseline12file và GoogleA-only đóngbăng. B sởhữu componentUIpage dashboard/newdashboard-ui-refinement.spec.ts và chỉcasehistoryui-refinement.spec.ts; Cnewadmin-ui-refinement.spec.ts nếucần; Dpublic-ui-refinement.spec.ts. Cần snapshotfile/report đúngphạmvi; root tuần tự hóatest/build. RootgiữsessionUserthật để kiểmrole/NCKH độc lập; không gửi secrettrongpromptworker.

- LeaseREDtask2 chạy D→B→Ctuầntự, đềuđãtrả. D:2failCTAhomebottom789.875>768/registermobile859.047>844,3pass. B:3failselectedpackagebottom1457>844,sốdư2dòng,usageemptybottom1039>844. C:3failoverviewtaskbottom1095>844,AItab36px,API503hiệnempty. Cácownerđangsửazoneriêng, leasetesthiệntrống. RootincognitoUsertab_hmới do tab7cũ khôngavailable,login200roleUser; GETNCKHmodels200có2modeltrênform4974389e-47f0-4831-adc5-fa1c38b55039. Mườiảnhactualtabstatechỉđọctạinckh-real-start/manifest.json; khôngcreate/activate/generate/collect/exportmodel.

- Task2: Bgeometry3pass,covering45pass4failchờchẩnđoánfixture/trace; khôngpatchnghiệpvụkhithiếu bằngchứng. DfirstGREEN29pass10fail:8SEOexpectedoriginlocalvsproduction,2fixturelabel/ProblemDetails; giữfailgốc,sửaconfig/testrồirechecktậptrung. CđangleaseGREEN19case; queuedBtargetedrồiDretry. Userlivetrướcmắt:creditrecord580–778,payment592–636h44/5gói/nooverflowVerified. UsagegặpNextserverJSONparseoverlaykhiHMR,giữstderr; HTTPGETsau200khôngchứngminhfixed, vẫnFailedchờfinalrestartổnđịnh/browserrecheck. Evidenceuser-page-checks-initial/manifest.json,khôngpatchauthnghiệpvụ.

- Cđóngbăng10file:9production+newadmin-ui-refinement.spec.ts, rootpackageadmin-c-review-{manifest-r1.json,package-r1.diff}. Cinitial15/19pass;4failselectorfirstmobileẩnởdesktop; sửavisiblecellselectorresponsive6/6pass,19requiredđượccoverquacáclượt,khôngsingleallgreen. Ctựchạyrerunngắntrướckhigia hạnrõ; rootgiữB,Bxácnhậnchưastart,khôngconcurrentrunnerthựctế; nhắclạimọireruncầnlease. Bđanglease16affectedcases; Dqueuedretry. CtrạngtháierrorUIgiữrequestcontract;chờreviewđộclập.

- Reviewđộc lậpB/Cchấpnhậncode+visualđúngphạmvi,khôngfinding sourcechặn. B29hash/APIAST/sharedtestngoàihistoryVerified;Adminbànphímgói/geometrypass, UserusageruntimevẫnFailedchờstablecheck. C10hash/8protectedfunctionVerified,16cặp/livepopup/keyboard/scrollpass. MinorC-R1-E1đãchúthíchgallery/reportbaselineplaceholder/loading;khôngsửasource. Dfinal39/39pass,6filefreeze; reviewđộclậpthấybeforearticlemờ, đangdựngbaselinepubliccôlậpđểsoổnđịnhtrungthực. Mọisourceproducthiệnđóngbăng.

- Integrated142filefreeze:lint0/auth9pass/build0; detectormechImpeccablechạymộtlần37targetUIexit0[]finding(khôngchứngnhậnthịgiác). MainNEXTSTART3020PID29616,API4940healthy/fixture9952giữ. Regressionđầu129pass1fail1skip:strictNCKHtitleclickthiếufixtureGETdetailđích(P2F-FINAL-CODE-01),caseảnhchưabậtPUBLIC_UI_CAPTURE;giữfail,chờtestfix/capturetargeted. RootUser20ảnhrouteổnđịnhintegrated/live-user/routes/manifest.jsonkhôngoverflow/badasset/overlay;usage604–839/235trong844/API200/assets200. GiữfailHMRcũriêng. D-R1-01đãđổinhãntừngarticlehistorictransition/layoutonly,bỏclaimstable/contrast;baseline3002Blockedpolicy(khônglýdoriêng),khôngbypass. Reviewcode/visualcuốiSol/highđangchạy.

## Bàn giao local cuối — 2026-10-29

- Snapshot UI local đã triển khai và review độc lập. Xem tiến độ để biết xác minh cuối, lịch sử test chính xác và giới hạn bằng chứng; provider-success vẫn Blocked.
- Verified: lint/build exit0, auth9/9; integrated initial129pass/1fail/1skip preserved. NCKH fixture-only correction RED1 → GREEN6/6; capture gate separately1/1pass with22 public PNGs. No single full131/131 rerun claimed. Stable actual User20/Admin16 observations; no document overflow, overlay or failed observed Next chunks.
- Evidence: `artifacts/reports/ui-refinement-2026-10-28/gallery-final.html`, `coverage.json`, `findings.json`, `integrated/checks.json`, `integrated/source-manifest-final.json`, final code/visual and fixture review reports, final runtime report. Original138-file baseline preserved.
- Hard model ceiling audited on new dispatches: final_coverage_docs, final_fixture_rereview, runtime_final_check explicitly gpt-6.1-sol/high; no nested children/Astra. Root documentation/evidence only. Production frozen; only two-line NCKH spec correction after142-file snapshot.
- Blocked: real provider-success prerequisite; optional baseline3002 startup automatically rejected with `blocked by policy`, no detailed reason/no retry bypass. Not run: real charge/grant/provider calls/import/generation/submission, physical device and full WCAG audit; no commit/push/merge/deploy.
- Tiếp theo: người dùng xem local3020 và gallery local; feedback đúng scope tiếp tục vòng owner/sửa/review độc lập. Giữ app/API sở hữu chạy; báo cáo runtime cuối ghi PID/log.

- Gate cuối: re-review fixture độc lập ACCEPT/ADDRESSED; runtime-final-check Verified. Kiểm bàn giao:9 tài liệu UTF-8,52 link tương đối tồn tại,138 hash baseline nguyên vẹn,121 tham chiếu ảnh gallery đủ,29route/58ảnh sau,git diff --check exit0. Bàn giao local sẵn sàng để người dùng nghiệm thu hình ảnh; trạng thái provider bắt buộc vẫn Blocked.

- Mở lại nghiệm thu thị giác: người dùng vẫn thấy UI to/cồng kềnh. Critique density A/B độc lập ngày2026-10-29; artifact density-review/ASSESSMENT.md. Chưa sửa sản phẩm. Đề xuất xử lý cấu trúc metrics, hierarchy lặp, gói nạp và placeholder forms; chốt hướng cụ thể trước batch sửa tiếp. Runtime Sol/high riêng khôi phục web; khôi phục API Blocked do migration thiếu source, giữ DB nguyên trạng.

- Người dùng chỉnh phạm vi: homepage là nguồn chính gây cảm giác bị zoom/to; các page khác đã khá ổn. Không áp dụng đề xuất density rộng trước đó vào dashboard/admin/auth. Đánh giá homepage live1280x800: CSS zoom1,h1 51.2px/4dòng,h2 44.8px,minh họa520px,hero648px,padding section89.6px/mỗi phía. Đề xuất chỉ tinh chỉnh typography/minh họa/nhịp dọc homepage; lượt đánh giá chưa sửa sản phẩm.

- Quyền commit: người dùng yêu cầu sync tài liệu và commit local thay đổi UI hiện có. Không push/merge/deploy. Đề xuất density giữ dạng lịch sử; follow-up mới nhất chỉ homepage, chưa triển khai. Runtime hiện tại khôi phục web3020; khôi phục API Blocked, smoke khỏe trước giữ là bằng chứng có thời điểm.

- Xác minh trước commit2026-10-29: lint mới exit0/auth9of9pass;142 hash frontend khớp snapshot cuối đã review;9 tài liệu UTF-8/54 link tương đối/138 hash baseline bảo toàn được kiểm;git diff --check exit0. Bằng chứng build/browser giữ là lịch sử trên cùng snapshot sản phẩm; không khẳng định runtime mới pass khi khôi phục API còn Blocked.

- Đã ghi đóng hồ sơ theo yêu cầu người dùng tại CLOSEOUT.md; không khẳng định mọi gate Done. Kiểm kê thấy ba bản sao app lịch sử ngoài repo; giữ chờ quyết định dọn. Giữ nhánh local/bằng chứng và web3020; không tiếp tục triển khai hoặc thao tác remote.

- Đã hoàn tất dọn được duyệt: xóa ba bản sao lịch sử ngoài repo sau kiểm đường dẫn/reparse; giữ node_modules chính. Agent runtime Sol/high riêng dừng webPID2792 sở hữu; cổng3020/3001/3002/7039/5235 và process task trống. Không còn lựa chọn dọn chờ chốt; giữ bằng chứng, follow-up sản phẩm chưa giải quyết giữ nguyên. Cập nhật closeout; không đổi sản phẩm/DB.
