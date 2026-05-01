import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Set your password</h2>
          <p className="text-sm text-[#6b6b7a] mb-5">
            Your squad admin created a temporary password for you. Please set a
            new one to continue.
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
