import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { ContactForm } from "@/features/support/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact manuelaX support.",
};

export default async function ContactPage() {
  const session = await auth();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Contact support</h1>
      <p className="mt-3 text-secondary">Questions, billing help, or DMCA notices.</p>
      <div className="mt-8">
        <ContactForm defaultEmail={session?.user?.email ?? ""} />
      </div>
    </section>
  );
}
