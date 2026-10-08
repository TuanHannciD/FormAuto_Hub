"use client";

// Verification-only page: copy this file to app/motion-test/page.tsx in the
// isolated build. It is not a production route and requires no API/account.
import { useEffect, useState } from "react";
import { TransitionRegion } from "@/components/motion/transition-region";

const sizes = [{ width: 150, height: 80 }, { width: 300, height: 260 }, { width: 240, height: 160 }];
export default function MotionFixture() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [step, setStep] = useState(0);
  const [extra, setExtra] = useState(0);
  return (
    <main data-motion-ready={ready} className="max-w-2xl space-y-4 p-8">
      <div>{sizes.map((_, index) => <button key={index} onClick={() => { setExtra(0); setStep(index); }}>Panel {index + 1}</button>)}<button onClick={() => setExtra(value => value + 60)}>Grow content</button></div>
      <div data-testid="motion-container">
        <TransitionRegion activeKey={String(step)}>
          <div className="bg-surface-subtle" style={{ width: sizes[step].width, height: sizes[step].height + extra }}>
            <button>Action {step + 1}</button>
          </div>
        </TransitionRegion>
      </div>
    </main>
  );
}
