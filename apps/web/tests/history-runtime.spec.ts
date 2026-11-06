import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const directory = path.resolve(process.cwd(), "../../.codex-tmp/fah-history-task6");
const session = (role: string) => JSON.parse(fs.readFileSync(path.join(directory, `${role}-session.json`), "utf8").replace(/^\uFEFF/, ""));
// Listing tests must work without local fixtures, sessions or an acquired API process.
const fixture = () => JSON.parse(fs.readFileSync(path.join(directory, "fixture.json"), "utf8").replace(/^\uFEFF/, ""));
test.beforeEach(({ baseURL }, info) => {
  if (process.env.FAH_HISTORY_RUNTIME_OPT_IN !== "1" || baseURL !== "http://localhost:3305" ||
      path.basename(info.config.configFile ?? "") !== "playwright.history-runtime.config.ts") {
    throw new Error("Owned Task6 runtime requires its dedicated config and FAH_HISTORY_RUNTIME_OPT_IN=1.");
  }
});
// All requests below hit the ordinary production-config loopback API. No route interception.
async function authenticate(page: Page, role: string) {
  const value = session(role);
  await page.addInitScript(value => localStorage.setItem("formauto.auth.session", JSON.stringify(value)), value);
  return value;
}

test("live owner history persists through reload, pages and blocked detail; chunks and mobile keyboard", async ({ page }) => {
  const errors: string[] = [], badChunks: string[] = [], api: {method: string;path: string;status: number}[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { const u=new URL(r.url()); if(u.pathname.includes("/_next/static/") && r.status()!==200) badChunks.push(u.pathname); if(u.origin==="http://127.0.0.1:5305") api.push({method:r.request().method(),path:u.pathname,status:r.status()}); });
  await authenticate(page,"owner");
  await page.goto("/dashboard/forms/history");
  await expect(page.getByText("Trang 1/2 · 20 kết quả")).toBeVisible();
  await page.reload(); await expect(page.getByText("Trang 1/2 · 20 kết quả")).toBeVisible();
  await page.getByRole("button",{name:"Sau",exact:true}).click(); await expect(page.getByText("Trang 2/2 · 20 kết quả")).toBeVisible();
  await page.getByRole("button",{name:"Xem lượt tạo",exact:true}).first().click();
  await expect(page.getByRole("heading",{name:"Chi tiết lượt tạo"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Xem lại và gửi"})).toBeDisabled();
  await expect(page.getByRole("checkbox").first()).toBeDisabled();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByText("Xem nội dung đầy đủ",{exact:true}).first().focus(); await page.keyboard.press("Enter");
  await expect(page.getByText("Synthetic response",{exact:true}).last()).toBeVisible();
  await page.screenshot({path:test.info().outputPath("live-detail390.png"),fullPage:true});
  expect(api.some(x=>x.path==="/api/generation-history"&&x.status===200)).toBe(true);
  expect(api.some(x=>x.path.startsWith("/api/generation-history/")&&x.status===200)).toBe(true);
  expect(api.filter(x=>x.method!=="GET")).toEqual([]); expect(errors).toEqual([]); expect(badChunks).toEqual([]);
});

for(const role of ["other","admin"]) test(`live ${role} session has no owner history and cannot read owner detail`,async({page,request})=>{
 const s=await authenticate(page,role);await page.goto("/dashboard/forms/history");
 await expect(page.getByText("Chưa có lượt tạo nào")).toBeVisible();
 await expect(page.getByText("Task6 synthetic owned project",{exact:true})).toHaveCount(0);
 const r=await request.get(`http://127.0.0.1:5305/api/generation-history/${fixture().currentBatchId}`,{headers:{Authorization:`Bearer ${s.accessToken}`}});expect(r.status()).toBe(404);
});

test("live account switch clears owner detail, logout routes to login without mutation",async({page})=>{
 await authenticate(page,"owner");await page.goto("/dashboard/forms/history");
 await page.getByRole("button",{name:"Xem lượt tạo",exact:true}).first().click();
 await expect(page.getByRole("heading",{name:"Chi tiết lượt tạo"})).toBeVisible();
 const posts: string[]=[];page.on("request",r=>{if(r.method()==="POST")posts.push(new URL(r.url()).pathname)});
 await page.evaluate(s=>{localStorage.setItem("formauto.auth.session",JSON.stringify(s));window.dispatchEvent(new Event("formauto-auth-session-changed"));},session("other"));
 await expect(page.getByRole("heading",{name:"Chi tiết lượt tạo"})).toHaveCount(0);
 await expect(page.getByText("Chưa có lượt tạo nào")).toBeVisible();
 await page.evaluate(()=>{localStorage.removeItem("formauto.auth.session");window.dispatchEvent(new Event("formauto-auth-session-changed"));});
 await expect(page).toHaveURL(/\/login/);expect(posts).toEqual([]);
});

test("live no-session history redirects and API401",async({page,request})=>{
 await page.goto("/dashboard/forms/history");await expect(page).toHaveURL(/\/login/);
 expect((await request.get("http://127.0.0.1:5305/api/generation-history")).status()).toBe(401);
});

test("live seeded project AI preview requires confirmation and rules one action remains fail-closed",async({page,request})=>{
 const owner=session("owner"),admin=session("admin");
 const headers={Authorization:`Bearer ${owner.accessToken}`,"X-FormAuto-Contract-Version":"2"};
 const base="http://127.0.0.1:5305",p=fixture().projectId;
 const grant=await request.post(`${base}/api/admin/credit-operations/manual-grants`,{headers:{Authorization:`Bearer ${admin.accessToken}`},data:{userId:owner.userId,credits:20,reason:"Task6 synthetic browser runtime grant"}});expect(grant.status()).toBe(200);const grantBody=await grant.json();
 const questions=await (await request.get(`${base}/api/forms/${p}/questions`,{headers})).json();
 const initial=await (await request.post(`${base}/api/projects/${p}/ai-responses/generate`,{headers,data:{mode:"Option2",count:1}})).json();
 expect(initial.generatedCount).toBe(1);
 // Existing owner recovery envelope bootstraps a SQL-seeded authorized project. No analyze interception or Google call.
 const analysis={projectId:p,name:"Task6 synthetic owned project",formUrl:"https://docs.google.com/forms/d/e/task6-synthetic/viewform",formTitle:"Task6 synthetic form",status:"Ready",questions:questions.items,createdAt:new Date().toISOString()};
 const direction={targetAge:"",role:"",context:"",tone:"Thân thiện",answerLength:"Ngắn",intent:""};
 const prompts={[fixture().qId]:"Synthetic answer"};
 const resume={contractVersion:2,generationBatchId:initial.generationBatchId,projectId:p,analysis,ruleConfigs:{[fixture().qId]:{mode:"SampleTextLines",configJson:'{"samples":["one","two"]}'}},generationMode:"ai-default",aiDirection:direction,aiGlobalPrompt:"Synthetic deterministic AI test",aiPromptScope:"global",aiQuestionPrompts:prompts,previewIds:initial.generatedPreviewIds,previewSnapshot:JSON.stringify({projectId:p,generationMode:"ai-default",config:{aiDirection:direction,aiGlobalPrompt:"Synthetic deterministic AI test",aiPromptScope:"global",aiQuestionPrompts:prompts}}),creditsUsed:initial.creditsUsed,userId:owner.userId,requestedCount:1,generatedCount:1,missingCredits:0,createdAt:new Date().toISOString()};
 await authenticate(page,"owner");await page.addInitScript(r=>localStorage.setItem("formauto.formPreviewResume",JSON.stringify(r)),resume);
 const posts:{path:string;data:any}[]=[];page.on("request",r=>{if(r.method()==="POST")posts.push({path:new URL(r.url()).pathname,data:r.postDataJSON()})});
 await page.goto("/dashboard/forms");
 await expect(page.getByRole("region",{name:"Tạo bản xem trước AI"})).toBeVisible();
 await page.getByRole("button",{name:"Tải lại cấu hình AI",exact:true}).click();
 const gen=page.waitForResponse(r=>r.url().endsWith("/ai-responses/generate")&&r.request().method()==="POST");
 await page.getByRole("button",{name:/Tạo.*preview|Tạo.*xem trước/i}).click();
 const generated=await gen;expect(generated.status()).toBe(200);const body=await generated.json();expect(body.generatedCount).toBe(1);expect(body.creditsUsed).toBe(1);
 const send=page.getByRole("button",{name:"Xác nhận gửi 1 lượt",exact:true});await expect(send).toBeDisabled();
 expect(posts.filter(x=>x.path.endsWith("/submissions/send"))).toHaveLength(0);
 await page.getByRole("checkbox").check();
 const blocked=page.waitForResponse(r=>r.url().endsWith("/submissions/send")&&r.request().method()==="POST");await send.click();
 const blockedResponse=await blocked;expect(blockedResponse.status()).toBe(409);expect((await blockedResponse.json()).code).toBe("FormEvidenceUnavailable");
 expect(posts.filter(x=>x.path.endsWith("/submissions/send"))).toHaveLength(1);expect(posts.find(x=>x.path.endsWith("/submissions/send"))?.data.confirmed).toBe(true);
 await page.reload();await expect(page.getByRole("region",{name:"Tạo bản xem trước AI"})).toBeVisible();
 expect(posts.filter(x=>x.path.endsWith("/submissions/send"))).toHaveLength(1);
 await page.getByRole("button",{name:/Quy tắc.*Tạo 0/}).click();
 await expect(page.getByRole("checkbox")).toHaveCount(0);await expect(page.getByRole("dialog")).toHaveCount(0);
 const direct=page.waitForResponse(r=>r.url().endsWith("/submissions/send-rules-direct")&&r.request().method()==="POST");
 await page.getByRole("button",{name:"Tạo và gửi ngay",exact:true}).click();
 const directResponse=await direct;expect(directResponse.status()).toBe(409);expect((await directResponse.json()).code).toBe("FormEvidenceUnavailable");
 expect(posts.filter(x=>x.path.endsWith("/submissions/send-rules-direct"))).toHaveLength(1);
 const summary=await (await request.get(`${base}/api/dashboard/summary`,{headers})).json();expect(summary.reservedCreditBalance).toBe(0);expect(summary.currentCreditBalance).toBe(grantBody.balanceAfter-2);expect(summary.availableCreditBalance).toBe(grantBody.balanceAfter-2);
 await page.screenshot({path:test.info().outputPath("live-rules-failclosed.png"),fullPage:true});
});
