import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to register and login pages
    if (path === '/register' || path === '/login') {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based access control
    if (path.startsWith("/dashboard/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/employee", req.url));
    }

    if (path.startsWith("/dashboard/manager") && token.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard/employee", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow access to register and login pages without authentication
        if (path === '/register' || path === '/login') {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/login",
    "/register",
  ],
}; 