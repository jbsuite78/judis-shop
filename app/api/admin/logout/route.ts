import {NextResponse} from "next/server";
import {ADMIN_COOKIE,hasValidOrigin} from "@/lib/admin-auth";
export async function POST(request:Request){
 if(!hasValidOrigin(request))return NextResponse.json({error:"Origen no permitido"},{status:403});
 const r=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 r.cookies.set(ADMIN_COOKIE,"",{path:"/",maxAge:0,httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict"});
 return r;
}
