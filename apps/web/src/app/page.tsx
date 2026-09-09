import { getTranslations } from "next-intl/server";
import { StatusBar } from "@/components/ui/StatusBar";

// Minimal placeholder — the real landing (create-a-dashboard hero, discovery
// grid) arrives in the parity phase. One hero line + the status-bar motif.
export default async function Home() {
  const t = await getTranslations("home");
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 sm:py-32">
      <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg font-light text-muted">{t("subtitle")}</p>
      <StatusBar status="releasing" size="lg" className="mt-10 max-w-md" />
    </section>
  );
}
