/**
 * Client logo strip — FR-2.14.
 *
 * Names come from the published projects, so the strip cannot claim a client
 * Kadokowe has not published work for.
 *
 * Wordmarks rather than images. The SRS records that the logo files are
 * supplied by the client and none have been yet, and a wordmark row is a
 * finished treatment in its own right rather than a placeholder — which is
 * why this does not carry an image field waiting to be filled. Add one when
 * the files arrive and there is something to put in it.
 */
export function ClientLogos({
  clients,
  heading,
}: {
  clients: string[];
  heading: string;
}) {
  if (clients.length === 0) return null;

  return (
    <section className="border-y border-line bg-paper py-10">
      <div className="px-gutter">
        <h2 className="eyebrow mb-6 text-center">{heading}</h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {clients.map((name) => (
            <li key={name}>
              <span className="font-display text-sm font-bold tracking-[0.08em] text-muted sm:text-base">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
