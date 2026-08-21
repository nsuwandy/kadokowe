import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentAdmin, getSession, verifyCredentials } from "@/lib/auth";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";

/**
 * Admin sign-in.
 *
 * The failure message never distinguishes an unknown address from a wrong
 * password — pairing that with the constant-time comparison in
 * verifyCredentials keeps the form from confirming which addresses exist.
 */
export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const admin = await currentAdmin();
  if (admin) redirect("/admin");

  const params = await searchParams;
  const failed = params?.error === "1";

  async function signIn(formData: FormData) {
    "use server";

    // NFR-3.5 — throttle before touching the password. The rejection is
    // deliberately the same "didn't match" screen as a wrong password: telling
    // an attacker they have hit a limit confirms they found a live endpoint
    // and tells them exactly how long to wait.
    const ip = clientIp(await headers());
    if (!rateLimit(`login:${ip}`, LIMITS.login).ok) {
      redirect("/admin/login?error=1");
    }

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const user = await verifyCredentials(email, password);
    if (!user) redirect("/admin/login?error=1");

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    await session.save();

    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 font-display text-base font-bold tracking-[0.14em]">
          KADO<span className="text-red">KOWE</span>
          <span className="ml-2 font-normal tracking-normal text-muted">admin</span>
        </div>

        <form action={signIn} className="flex flex-col gap-4 bg-paper p-8">
          <h1 className="text-lg font-semibold">Sign in</h1>

          {failed && (
            <p role="alert" className="border-l-2 border-red bg-warm px-4 py-3 text-sm">
              Those details didn&apos;t match. Check the email and password and try
              again.
            </p>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="border border-line px-4 py-3 text-[0.9375rem] outline-none focus:border-red"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-line px-4 py-3 text-[0.9375rem] outline-none focus:border-red"
            />
          </label>

          <button className="mt-2 bg-red px-6 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
