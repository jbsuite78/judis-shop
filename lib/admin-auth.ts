import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export const ADMIN_COOKIE = "judis_admin_session";
const MAX_AGE_SECONDS = 12 * 60 * 60;
function sessionKey() { const k = process.env.JUDIS_ADMIN_SESSION_SECRET; return k && k.length >= 32 ? k : null; }
function safeEqual(a: string,b: string) { return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest()); }
export function validAdminPassword(password: unknown) {
 const configured = process.env.JUDIS_ADMIN_PASSWORD ?? "";
 return typeof password === "string" && !!configured && password.length < 200 && safeEqual(password,configured);
}
function signature(body:string,key:string) {return createHmac("sha256",key).update(body).digest("base64url");}
export function issueAdminToken():string|null {
 const key=sessionKey(); if(!key)return null;
 const body=Buffer.from(JSON.stringify({v:1,exp:Math.floor(Date.now()/1000)+MAX_AGE_SECONDS,nonce:randomBytes(16).toString("hex")})).toString("base64url");
 return body+"."+signature(body,key);
}
export function verifyAdminToken(token:string|undefined|null):boolean {
 const key=sessionKey();if(!key||!token||token.length>1000)return false;
 const parts=token.split(".");if(parts.length!==2)return false;
 const [body,sig]=parts;if(!body||!sig||!safeEqual(sig,signature(body,key)))return false;
 try {const data=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));const now=Math.floor(Date.now()/1000);
 return data.v===1&&Number.isInteger(data.exp)&&data.exp>now&&data.exp<=now+MAX_AGE_SECONDS;}catch{return false;}
}
export function hasAdminSession(request:Request):boolean {
 const pair=(request.headers.get("cookie")??"").split(";").map(x=>x.trim()).find(x=>x.startsWith(ADMIN_COOKIE+"="));
 if(!pair)return false;try{return verifyAdminToken(decodeURIComponent(pair.slice(ADMIN_COOKIE.length+1)));}catch{return false;}
}
export function hasValidOrigin(request:Request):boolean {
 const origin=request.headers.get("origin");if(!origin)return true;
 try {const a=new URL(origin),b=new URL(request.url);return a.protocol===b.protocol&&a.host===b.host;}catch{return false;}
}
export function isAdminMutation(request:Request) {return hasAdminSession(request)&&hasValidOrigin(request);}
export function isCronRequest(request:Request) {
 const secret=process.env.CRON_SECRET;return !!secret&&safeEqual(request.headers.get("authorization")??"","Bearer "+secret);
}
export function unauthorizedResponse() {return Response.json({error:"No autorizado. Inicia sesión como administrador."},{status:401,headers:{"Cache-Control":"no-store"}});}
export const adminCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/",maxAge:MAX_AGE_SECONDS};
