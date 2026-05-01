import { CreateTournamentForm } from "./CreateTournamentForm";

export default function NewTournamentPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="label-overline">Super Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          New Tournament
        </h1>
      </div>
      <CreateTournamentForm />
    </div>
  );
}
