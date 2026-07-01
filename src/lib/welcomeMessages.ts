export const WELCOME_MESSAGES: ((name: string) => string)[] = [
  (name) => `Good to see you, ${name}.`,
  (name) => `Welcome back, ${name}. Let's build something.`,
  (name) => `${name}, your domain awaits.`,
  (name) => `Ready when you are, ${name}.`,
  (name) => `${name}, the canvas is blank. Let's fill it.`,
  (name) => `Another day, another chapter, ${name}.`,
  (name) => `${name}, all systems aligned.`,
  (name) => `Hey ${name}. Time to move the needle.`,
  (name) => `${name}, where were we?`,
  (name) => `The stage is set, ${name}.`,
  (name) => `${name}, clarity starts here.`,
  (name) => `Let's make today count, ${name}.`,
  (name) => `${name}, your momentum is waiting.`,
  (name) => `Back in the driver's seat, ${name}.`,
  (name) => `${name}, the blueprint is loading.`,
  (name) => `Fresh perspective, ${name}. Let's go.`,
  (name) => `${name}, your thoughts have a home here.`,
  (name) => `Tuned in and ready, ${name}.`,
  (name) => `${name}, pick up right where you left off.`,
  (name) => `The workshop is open, ${name}.`,
  (name) => `${name}, let's sharpen the focus.`,
  (name) => `Welcome to your corner, ${name}.`,
  (name) => `${name}, ideas are queued and waiting.`,
  (name) => `Onwards, ${name}.`,
  (name) => `${name}, the signal is clear.`,
  (name) => `What's on your mind today, ${name}?`,
  (name) => `${name}, let's get into it.`,
  (name) => `Your rhythm, your pace, ${name}.`,
  (name) => `${name}, small steps compound.`,
  (name) => `Everything in its place, ${name}.`
];

export function getRandomWelcome(name: string): string {
  const index = Math.floor(Math.random() * WELCOME_MESSAGES.length);
  return WELCOME_MESSAGES[index](name);
}
