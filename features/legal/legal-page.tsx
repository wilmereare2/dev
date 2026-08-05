import Link from "next/link";
import { Button } from "@/components/ui/button";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  description: string;
  sections: LegalSection[];
  showContact?: boolean;
};

export function LegalPage({ title, description, sections, showContact = false }: LegalPageProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-secondary">{description}</p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <article key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
      {showContact ? (
        <div className="mt-10">
          <Button asChild variant="secondary">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
