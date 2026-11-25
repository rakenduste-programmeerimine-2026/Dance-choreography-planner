import { signOut } from "./auth/actions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Tantsukava</h1>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-full border border-slate-300 px-6 py-3 font-medium hover:bg-slate-100"
        >
          Logi välja
        </button>
      </form>
    </main>
  );
}
