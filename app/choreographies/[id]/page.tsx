import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/choreography-input";
import { isDancerList } from "@/lib/dancers";
import { DancerPanel } from "./dancer-panel";

export default function Page({ params, searchParams }: PageProps<"/choreographies/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <Link href="/" className="text-sm text-slate-600 hover:underline">← Minu koreograafiad</Link>
      <Suspense fallback={<p>Laen…</p>}>
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Awaits the request-time params inside Suspense, and reads cookies, so it is rendered per request and never cached.
async function Editor({ params, searchParams }: PageProps<"/choreographies/[id]">) {
  const { id } = await params;
  const { scene: sceneParam } = await searchParams;
  if (!isUuid(id)) notFound();

  // The Supabase client reads the clock while loading the session, which cannot happen during prerender.
  await connection();
  const supabase = await createClient();
  // RLS returns only the signed-in user's choreography, so another user's id is a 404.
  const { data: choreography } = await supabase
    .from("choreographies")
    .select("id, title, dancers, scenes (id, name, sort_order)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "scenes" })
    .maybeSingle();
  if (!choreography || !isDancerList(choreography.dancers)) notFound();

  // The shown scene is the `scene` search param; a missing or unknown id falls back to the first scene.
  const scenes = choreography.scenes;
  const scene = scenes.find((s) => s.id === sceneParam) ?? scenes[0];

  return (
    <>
      <h1 className="text-3xl font-semibold">{choreography.title}</h1>
      <DancerPanel choreographyId={choreography.id} sceneId={scene.id} dancers={choreography.dancers} />
    </>
  );
}
