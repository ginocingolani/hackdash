import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { DiamondMark, Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { SearchInput } from "@/components/ui/Input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export async function Header() {
  const [session, t] = await Promise.all([auth(), getTranslations("header")]);
  const user = session?.user;

  return (
    <header className="border-b border-line bg-raised">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4">
        <Link
          href="/"
          aria-label={t("home")}
          className="flex items-center gap-2.5 rounded-md"
        >
          <DiamondMark size={24} />
          <Wordmark className="text-sm" />
        </Link>

        {/* Placeholder search slot — wired to discovery in a later phase. */}
        <div className="ml-2 hidden max-w-xs flex-1 md:block">
          <SearchInput
            label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle />
          {user ? (
            <span className="flex items-center gap-2">
              <DiamondAvatar
                name={user.name ?? user.email ?? "?"}
                src={user.image}
                entity="user"
                size="sm"
              />
              <Button href="/api/auth/signout" variant="ghost" size="sm">
                {t("logOut")}
              </Button>
            </span>
          ) : (
            <Button href="/api/auth/signin" variant="primary" size="sm">
              {t("logIn")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
