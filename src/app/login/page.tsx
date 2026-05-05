import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-10">
          <p className="label-overline mb-2">Next Level Roundnet</p>
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NLR Platform
          </h1>
        </div>

        <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-5">Sign in</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
