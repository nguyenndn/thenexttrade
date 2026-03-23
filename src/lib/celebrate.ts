/**
 * XP Celebration Effects
 * Reusable confetti/fireworks celebration synced with Streak page style.
 * Usage: await celebrateXP({ xp: 50, message: "Lesson Complete!" })
 */

export interface CelebrationOptions {
  xp: number;
  message?: string;
  badge?: string | null;
  leveledUp?: boolean;
}

/**
 * Trigger fireworks confetti celebration (matches streak check-in style).
 * Dynamically imports canvas-confetti to avoid bundle bloat.
 */
export async function celebrateXP(opts: CelebrationOptions) {
  const { toast } = await import("sonner");

  // Show XP toast
  const lines = [`+${opts.xp} XP`];
  if (opts.badge) lines.push(`🏅 Badge: ${opts.badge}`);
  if (opts.leveledUp) lines.push("⬆️ Level Up!");

  toast.success(opts.message || "XP Earned!", {
    description: lines.join(" • "),
    duration: 4000,
  });

  // Fireworks confetti (same effect as streak check-in)
  const confetti = (await import("canvas-confetti")).default;

  const duration = opts.leveledUp ? 3000 : 1500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.3, 0.5) },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.3, 0.5) },
    });
  }, 250);
}
