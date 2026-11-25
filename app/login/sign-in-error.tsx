export async function SignInError({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="text-red-600">
      Sisselogimine ebaõnnestus. Proovi uuesti.
    </p>
  );
}
