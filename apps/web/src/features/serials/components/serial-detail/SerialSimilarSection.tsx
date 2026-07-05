import { Link } from "@tanstack/react-router";
import type { SerialDetailResponse } from "@/features/serials/api";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { getPosterUrl } from "@/features/serials/components/utils";

type SerialSimilarSectionProps = {
  similar: SerialDetailResponse["similar"];
};

export const SerialSimilarSection = ({ similar }: SerialSimilarSectionProps) => {
  if (!similar || similar.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t pt-8" style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}>
      <h2 className="mb-6 font-mono text-lg font-bold" style={{ color: SERIAL_MODULE_STYLES.text }}>
        Similar Shows
      </h2>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
        {similar.map((series) => (
          <Link
            key={`similar-${series.tmdbId}`}
            to="/serials/$tmdbId"
            params={{ tmdbId: String(series.tmdbId) }}
            className="group flex flex-col gap-2"
          >
            <div
              className="relative aspect-[2/3] overflow-hidden border transition-all duration-300 group-hover:scale-[1.03]"
              style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
            >
              <img
                src={getPosterUrl(series.posterPath)}
                alt={series.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <span
                className="line-clamp-1 font-mono text-xs font-semibold group-hover:text-primary transition-colors"
                style={{ color: SERIAL_MODULE_STYLES.text }}
              >
                {series.title}
              </span>
              {series.firstAirYear ? (
                <span className="font-mono text-[10px]" style={{ color: SERIAL_MODULE_STYLES.muted }}>
                  {series.firstAirYear}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
