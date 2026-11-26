import { createClient } from "@/lib/supabase/server";
import { updateChoreography } from "./actions";
import { ChoreographyForm } from "./choreography-form";
import { DeleteButton } from "./delete-button";

// Reads cookies through the Supabase client, so it is rendered per request and never cached.
export async function ChoreographyList() {
  const supabase = await createClient();
  // RLS returns only the signed-in user's rows.
  const { data, error } = await supabase
    .from("choreographies")
    .select("id, title, stage_width_m, stage_depth_m")
    .order("created_at", { ascending: false });

  if (error) return <p role="alert">Koreograafiate laadimine ebaõnnestus</p>;
  if (data.length === 0) return <p className="text-slate-600">Sul pole veel ühtegi koreograafiat</p>;

  return (
    <ul className="flex flex-col gap-4">
      {data.map((c) => (
        <li key={c.id} className="rounded border border-slate-300 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">{c.title}</h3>
              <p className="text-sm text-slate-600">{c.stage_width_m} × {c.stage_depth_m} m</p>
            </div>
            <DeleteButton id={c.id} title={c.title} />
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm">Muuda</summary>
            <div className="mt-3">
              <ChoreographyForm
                action={updateChoreography}
                submitLabel="Salvesta"
                initial={{ id: c.id, title: c.title, width: c.stage_width_m, depth: c.stage_depth_m }}
                showResizeNote
              />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
