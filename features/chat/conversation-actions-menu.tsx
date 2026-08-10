"use client";

import { useState } from "react";
import { Ban, Flag, MoreHorizontal, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportContentForm } from "@/features/content/report-content-form";
import { blockMember, muteMember } from "@/features/settings/safety-form";

type ConversationActionsMenuProps = {
  peerId: string;
  peerName: string;
  signedIn: boolean;
};

export function ConversationActionsMenu({ peerId, peerName, signedIn }: ConversationActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!signedIn) return null;

  async function handleBlock() {
    setPending(true);
    setMessage(null);
    const ok = await blockMember(peerId);
    setPending(false);
    setOpen(false);
    setMessage(ok ? `${peerName} has been blocked.` : "Could not block this member.");
  }

  async function handleMute() {
    setPending(true);
    setMessage(null);
    const ok = await muteMember(peerId);
    setPending(false);
    setOpen(false);
    setMessage(ok ? `${peerName} has been muted.` : "Could not mute this member.");
  }

  return (
    <div className="relative ml-auto">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Conversation options"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            <button
              type="button"
              disabled={pending}
              onClick={handleMute}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-muted/40"
            >
              <VolumeX className="size-4" aria-hidden />
              Mute
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={handleBlock}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 hover:bg-muted/40"
            >
              <Ban className="size-4" aria-hidden />
              Block
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReport((value) => !value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-muted/40"
            >
              <Flag className="size-4" aria-hidden />
              Report
            </button>
          </div>
        </>
      ) : null}

      {message ? <p className="absolute right-0 top-full mt-2 w-56 text-right text-xs text-accent">{message}</p> : null}

      {showReport ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Report {peerName}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowReport(false)}>
                Close
              </Button>
            </div>
            <div className="mt-4">
              <ReportContentForm targetUserId={peerId} signedIn={signedIn} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
