import { NextRequest,NextResponse } from "next/server";
import { hasAdminSession } from "./lib/admin-auth";
export function proxy(request:NextRequest){
 if(hasAdminSession(request))return NextResponse.next();
 const url=request.nextUrl.clone();const previous=url.pathname;
 url.pathname="/acceso";url.search="";url.searchParams.set("next",previous);
 return NextResponse.redirect(url);
}
export const config={matcher:["/admin/:path*"]};
