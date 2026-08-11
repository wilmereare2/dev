"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type BillingReturnBannerProps = {
  successMessage?: string;
  failedMessage?: string;
  className?: string;
};

export function BillingReturnBanner({
  successMessage = "Payment completed successfully.",
  failedMessage = "Payment was not completed. Try again or contact support.",
  className,
}: BillingReturnBannerProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"success" | "failed" | null>(null);

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      setStatus("success");
      router.replace(pathname);
    } else if (billing === "failed") {
      setStatus("failed");
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  if (!status) return null;

  const success = status === "success";

  return (
    <div
      role="status"
      className={cn(
        "mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        success
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-red-500/30 bg-red-500/10 text-red-100",
        className,
      )}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-red-400" aria-hidden />
      )}
      <p>{success ? successMessage : failedMessage}</p>
    </div>
  );
}
