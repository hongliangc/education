import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const PROTECTED_PREFIXES = ["/child-select", "/world", "/play", "/dashboard", "/story", "/theater"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth;
  const path = nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  if (isProtected && !isAuthed) {
    const url = new URL("/login", nextUrl.origin);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (path === "/" && isAuthed) {
    return NextResponse.redirect(new URL("/child-select", nextUrl.origin));
  }
  if (path === "/" && !isAuthed) {
    return NextResponse.redirect(new URL("/login", nextUrl.origin));
  }

  if ((path === "/login" || path === "/register") && isAuthed) {
    return NextResponse.redirect(new URL("/child-select", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
