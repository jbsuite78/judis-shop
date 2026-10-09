import {NextRequest,NextResponse} from "next/server";
import {ADMIN_COOKIE,adminCookieOptions,issueAdminToken,validAdminPassword,hasValidOrigin} from "@/lib/admin-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const attempts=new Map<string,{count:number;until:number}>();
const MAX_ATTEMPTS=8,WINDOW_MS=15*60*1000;
export async function POST(request:NextRequest){
 if(!hasValidOrigin(request))return NextResponse.json({error:"Origen no permitido"},{status:403});
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now(),state=attempts.get(ip);
 if(state&&state.until>now&&state.count>=MAX_ATTEMPTS)return NextResponse.json({error:"Demasiados intentos"},
 {status:429,headers:{"Retry-After":String(Math.ceil((state.until-now)/1000))}});
 let body:{password?:unknown}={};try{body=await request.json();}catch{return NextResponse.json({error:"Solicitud inválida"},{status:400});}
 if(!validAdminPassword(body?.password)){
  const current=state&&state.until>now?state.count:0;attempts.set(ip,{count:current+1,until:now+WINDOW_MS});
  return NextResponse.json({error:"Credenciales incorrectas"},{status:401,headers:{"Cache-Control":"no-store"}});
 }
 const token=issueAdminToken();if(!token)return NextResponse.json({error:"Inicio de sesión no disponible"},{status:503});
 attempts.delete(ip);
 const r=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 r.cookies.set(ADMIN_COOKIE,token,adminCookieOptions);return r;
}
