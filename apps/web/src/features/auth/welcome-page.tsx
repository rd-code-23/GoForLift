// Presents the responsive welcome page and entry points for Google sign-in and guest access.
import { useNavigate } from '@tanstack/react-router';
import { UserRound } from 'lucide-react';

import shipUrl from '../../assets/goforlift-ship.png';
import headingUrl from '../../assets/train-with-purpose.png';
import desktopStarfieldUrl from '../../assets/welcome-starfield-desktop.webp';
import starfieldUrl from '../../assets/welcome-starfield.webp';
import wordmarkUrl from '../../assets/goforlift-wordmark.png';
import { Button } from '../../components/ui/button';
import { startGuestSession } from './guest-session';

export function WelcomePage() {
  const navigate = useNavigate();

  function continueAsGuest() {
    startGuestSession();
    void navigate({ to: '/dashboard' });
  }

  return (
    <main className="welcome-starfield flex min-h-screen items-center justify-center overflow-hidden px-6 py-8 text-foreground sm:px-8">
      <picture aria-hidden="true" className="absolute inset-0">
        <source media="(min-width: 640px)" srcSet={desktopStarfieldUrl} />
        <img alt="" className="size-full object-cover" src={starfieldUrl} />
      </picture>
      <section className="welcome-panel relative z-10 flex w-full max-w-[390px] flex-col items-center px-1 py-5 text-center sm:max-w-[520px] sm:scale-[0.82] sm:px-16 sm:py-14">
        <img
          alt=""
          aria-hidden="true"
          className="w-[135px] max-w-full sm:w-[149px]"
          src={shipUrl}
        />
        <img
          alt="GoForLift"
          className="-mt-4 w-[230px] max-w-full sm:-mt-5 sm:w-[250px]"
          src={wordmarkUrl}
        />
        <h1 className="-mt-4">
          <img
            alt="Train with purpose."
            className="w-[270px] max-w-full sm:w-[290px]"
            src={headingUrl}
          />
        </h1>
        <p className="-mt-7 max-w-[310px] text-[16px] leading-7 text-muted-foreground sm:text-[15px] sm:leading-6">
          Create routines, complete guided
          <br className="hidden sm:block" /> workouts, and track your progress.
        </p>
        <div className="mt-10 grid w-full gap-3 sm:mt-9">
          <Button
            asChild
            className="h-14 rounded-md bg-white text-[16px] font-medium text-neutral-950 shadow-sm hover:bg-neutral-200"
          >
            <a href="/auth/google">
              <GoogleMark />
              Continue with Google
            </a>
          </Button>
          <Button
            className="h-14 rounded-md border-white/45 bg-white/[0.025] text-[16px] font-medium hover:bg-white/10"
            onClick={continueAsGuest}
            type="button"
            variant="outline"
          >
            <UserRound aria-hidden="true" className="size-5" />
            Continue as guest
          </Button>
        </div>
        <p className="mt-7 max-w-[260px] text-sm leading-5 text-muted-foreground">
          Guest progress is temporary and will not be saved.
        </p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.5 14a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9.1L6.5 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.1c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.4 2.7A5.9 5.9 0 0 1 12 6.1Z"
      />
    </svg>
  );
}
