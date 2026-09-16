import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/find-jobs/:path*",
    "/saved-jobs/:path*",
    "/applications/:path*",
    "/master-profile/:path*",
    "/resume-studio/:path*",
    "/cover-letter/:path*",
    "/ai-hub/:path*",
    "/jobs/:path*",
  ],
};
