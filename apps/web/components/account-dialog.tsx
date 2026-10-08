"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from "./ui";
import { AccountProfilePanel } from "./account-profile-panel";
import { AccountSecurityPanel } from "./account-security-panel";
import { TransitionRegion } from "./motion/transition-region";
import { useDialogPhase } from "./dialog";
import { motionDefaults } from "./motion/motion-presets";

export function AccountDialog({ onClose, onLogout }: { onClose: () => void; onLogout: () => Promise<void> }) {
  const [section, setSection] = useState<"profile" | "security">("profile");
  const [loggingOut, setLoggingOut] = useState(false);
  return (
    <Dialog open className="max-w-lg" onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="flex max-w-lg flex-col overflow-hidden" contentClassName="flex max-h-[calc(100dvh-2rem-2px)] shrink-0 flex-col">
        <AccountContent section={section} setSection={setSection} loggingOut={loggingOut} setLoggingOut={setLoggingOut} onLogout={onLogout} />
      </DialogContent>
    </Dialog>
  );
}

function AccountContent({ section, setSection, loggingOut, setLoggingOut, onLogout }: {
  section: "profile" | "security"; setSection: (section: "profile" | "security") => void;
  loggingOut: boolean; setLoggingOut: (value: boolean) => void; onLogout: () => Promise<void>;
}) {
  const phase = useDialogPhase();
  return <>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <DialogTitle>Tài khoản</DialogTitle>
          <DialogClose size="icon" aria-label="Đóng tài khoản"><X aria-hidden="true" size={18} /></DialogClose>
        </div>
        <div className="flex shrink-0 gap-2 px-5 pt-3" role="group" aria-label="Cài đặt tài khoản">
          <Button variant={section === "profile" ? "primary" : "secondary"} aria-pressed={section === "profile"} onClick={() => setSection("profile")}>Hồ sơ</Button>
          <Button variant={section === "security" ? "primary" : "secondary"} aria-pressed={section === "security"} onClick={() => setSection("security")}>Bảo mật</Button>
        </div>
        <TransitionRegion activeKey={section} duration={phase === "open" ? motionDefaults.duration : 0} className="min-h-0">
          <div className="px-5 py-4">{section === "profile" ? <AccountProfilePanel /> : <AccountSecurityPanel />}</div>
        </TransitionRegion>
        <div className="flex shrink-0 justify-end border-t border-border px-5 py-2">
          <Button variant="secondary" className="border-0 text-destructive shadow-none" disabled={loggingOut} onClick={async () => {
            if (loggingOut) return;
            setLoggingOut(true);
            try { await onLogout(); } finally { setLoggingOut(false); }
          }}>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
        </div>
  </>;
}
