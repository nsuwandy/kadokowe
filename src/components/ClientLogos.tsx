import { Plate } from "@/components/ui/Plate";

/**
 * Client logo strip — FR-2.14.
 *
 * Names come from the published projects, so the strip cannot claim a client
 * Kadokowe has not published work for.
 *
 * A client with a logo on file shows it; one without shows its name set in
 * the display face. Mixing the two is deliberate — the strip has to look
 * finished from the first published project, long before every logo has been
 * collected, and a row of empty boxes waiting for artwork does not.
 */
export function ClientLogos({
  clients,
  heading,
}: {
  clients: { name: string; logo: string | null }[];
  heading: string;
}) {
  if (clients.length === 0) return null;

  return (
    <section className="border-y border-line bg-paper py-10">
      <div className="px-gutter">
        <h2 className="eyebrow mb-6 text-center">{heading}</h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {clients.map((client) => (
            <li key={client.name}>
              {client.logo ? (
                <div className="w-24 sm:w-28">
                  <Plate
                    publicId={client.logo}
                    alt={client.name}
                    ratio="3 / 1"
                    sizes="112px"
                  />
                </div>
              ) : (
                <span className="font-display text-sm font-bold tracking-[0.08em] text-muted sm:text-base">
                  {client.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
