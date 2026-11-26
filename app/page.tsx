import { Suspense } from "react";
import { signOut } from "./auth/actions";
import { createChoreography } from "./choreographies/actions";
import { ChoreographyForm } from "./choreographies/choreography-form";
import { ChoreographyList } from "./choreographies/choreography-list";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Tantsukava</h1>
        <form action={signOut}>
          <button type="submit" className="rounded-full border border-slate-300 px-6 py-3 font-medium hover:bg-slate-100">
            Logi välja
          </button>
        </form>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Uus koreograafia</h2>
        <ChoreographyForm action={createChoreography} submitLabel="Loo" />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Minu koreograafiad</h2>
        <Suspense fallback={<p>Laen…</p>}>
          <ChoreographyList />
        </Suspense>
      </section>
    </main>
  );
}
