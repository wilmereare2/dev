import Link from "next/link";
import { Check, Crown, Sparkles, TrendingUp } from "lucide-react";
import { TrustBar } from "@/components/layout/trust-bar";
import { Button } from "@/components/ui/button";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  interval: string;
  priceCents: number;
  currency: string;
  trialDays: number;
};

type PricingViewProps = {
  plans: Plan[];
};

const MEMBER_FEATURES = [
  "Unlimited access to the premium catalog",
  "HD streaming with cinematic playback",
  "Personal library, watch later, and history",
  "Early access to featured releases",
  "Cancel anytime from your account",
] as const;

const CREATOR_FEATURES = [
  "Upload photos, videos, and premium posts",
  "Creator analytics and earnings dashboard",
  "Promotions, PPV, and subscriber tools",
  "Moderation workflow and verified profile",
  "Apply in minutes — onboard after sign-up",
] as const;

function formatPrice(plan: Plan) {
  const amount = (plan.priceCents / 100).toFixed(2);
  const suffix = plan.interval === "year" ? "/year" : plan.interval === "month" ? "/month" : `/${plan.interval}`;
  return { amount, suffix };
}

export function PricingView({ plans }: PricingViewProps) {
  const monthly = plans.find((plan) => plan.interval === "month" || plan.slug.includes("month"));
  const yearly = plans.find((plan) => plan.interval === "year" || plan.slug.includes("year"));
  const featuredPlan = monthly ?? plans[0] ?? null;

  return (
    <div className="pb-12">
      <section className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
          <Crown className="size-3.5" />
          Membership
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Unlock the full manuelaX experience
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Premium catalog access, HD playback, and member-only releases — built for discerning audiences
          and verified creators.
        </p>
      </section>

      <TrustBar />

      <section className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <article className="relative overflow-hidden rounded-3xl border border-accent/30 bg-surface/60 p-8 shadow-xl shadow-accent/10 backdrop-blur-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-accent/20 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="size-5" aria-hidden />
              <h2 className="font-display text-2xl font-semibold">Premium Member</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to browse, save, and stream exclusive creator content.
            </p>

            {featuredPlan ? (
              <p className="mt-6 font-display text-4xl font-semibold tracking-tight">
                ${formatPrice(featuredPlan).amount}
                <span className="text-base font-normal text-muted-foreground">
                  {formatPrice(featuredPlan).suffix}
                </span>
              </p>
            ) : (
              <p className="mt-6 font-display text-4xl font-semibold tracking-tight">
                Plans launching soon
              </p>
            )}

            {yearly && monthly ? (
              <p className="mt-2 text-sm text-muted-foreground">
                or ${formatPrice(yearly).amount}/year · save vs monthly
              </p>
            ) : null}

            <ul className="mt-8 space-y-3">
              {MEMBER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <Button asChild size="lg" variant="premium" className="mt-8 w-full sm:w-auto">
              <Link href="/account">Subscribe</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Sign in or create an account, then manage billing from{" "}
              <Link href="/subscriptions" className="text-accent hover:underline">
                Subscriptions
              </Link>
              .
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-border/60 bg-surface/50 p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-foreground">
            <TrendingUp className="size-5 text-accent" aria-hidden />
            <h2 className="font-display text-2xl font-semibold">Creator</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Publish premium content, grow your audience, and monetize with platform tools.
          </p>

          <p className="mt-6 font-display text-4xl font-semibold tracking-tight">
            Earn
            <span className="text-base font-normal text-muted-foreground"> on your terms</span>
          </p>

          <ul className="mt-8 space-y-3">
            {CREATOR_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>

          <Button asChild size="lg" variant="secondary" className="mt-8 w-full sm:w-auto">
            <Link href="/contact">Apply as creator</Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Already registered? Enable creator tools during sign-up or from your account hub.
          </p>
        </article>
      </section>

      {plans.length > 0 ? (
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-semibold tracking-tight">Available plans</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-border/60 bg-surface/40 p-5 backdrop-blur-sm"
              >
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                {plan.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                ) : null}
                <p className="mt-4 text-2xl font-bold">
                  ${formatPrice(plan).amount}
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatPrice(plan).suffix}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
