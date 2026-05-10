import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const KEY = "family-photos.welcomed";

const CARD_ONE = `Hi Mum,

Thanks for always looking out for me and encouraging me to do my best. I know how much you care about me and Sean, and I'm grateful that you have put so much effort into raising us into good people.

Thanks for all the sacrifices you have made for us and all the experiences and opportunities you've provided. You've put countless hours of effort into providing for us, and I'm deeply thankful.

Lots of love,
Mitchell`;

const CARD_TWO = `Dear Mum,

I know I don't say it enough, but I do love you. I know we always get into arguments, but I appreciate you, and I always will appreciate you. I'm never going to stop appreciating you and all the effort you put into raising me and Mitchell.

Thank you so much for being an amazing mother, and I hope you enjoy the photos as much as we do.

Happy Mother's Day.

Love,
Sean`;

const EVENT = "family-photos.show-messages";

export function openWelcomeMessages() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 intro, 1 card1, 2 card2
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {}
    const handler = () => {
      setStep(1);
      setOpen(true);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open || step !== 0) return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open, step]);

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        key={step}
        className="relative w-full max-w-md rounded-2xl border bg-background shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 fade-in duration-300"
      >
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
            <Heart className="h-6 w-6 text-white" fill="currentColor" />
          </div>
        </div>

        {step === 0 && (
          <>
            <h2 className="font-display text-2xl sm:text-3xl text-center font-semibold mb-2">
              Welcome, Mum
            </h2>
            <p className="text-center text-muted-foreground mb-6 text-sm sm:text-base">
              We've put together something special for you. Take a moment, then continue when you're ready.
            </p>
            <Button
              onClick={() => setStep(1)}
              disabled={countdown > 0}
              className="w-full"
              size="lg"
            >
              {countdown > 0 ? `Continue in ${countdown}…` : "Continue"}
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display text-xl sm:text-2xl text-center font-semibold mb-4">
              From Mitchell
            </h2>
            <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line max-h-[55vh] overflow-y-auto pr-1 mb-6">
              {CARD_ONE}
            </div>
            <Button onClick={() => setStep(2)} className="w-full" size="lg">
              Next message
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-xl sm:text-2xl text-center font-semibold mb-4">
              From Sean
            </h2>
            <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line max-h-[55vh] overflow-y-auto pr-1 mb-6">
              {CARD_TWO}
            </div>
            <Button onClick={close} className="w-full" size="lg">
              View the photos
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
