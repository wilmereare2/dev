import Link from "next/link";
import { Button } from "@/components/ui/button";

type AccountSyncNoticeProps = {
  email?: string | null;
};

export function AccountSyncNotice({ email }: AccountSyncNoticeProps) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium text-amber-200">Your session is out of sync with the database.</p>
      <p className="mt-2 text-muted-foreground">
        This usually happens after a database migration. Sign out, then register or sign in again
        {email ? (
          <>
            {" "}
            with <strong className="text-foreground">{email}</strong>
          </>
        ) : null}{" "}
        to restore your account before saving a profile photo.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href="/account">Go to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
