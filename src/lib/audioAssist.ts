// Natural Speech Synthesis & Audio Assist Engine for Training

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

// Gentle pleasant chime when advancing or toggling audio
export function playChime(frequency = 587.33, type: OscillatorType = "sine", duration = 0.15) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
}

// Helper to choose the most natural and realistic human voice available
export function getBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. First priority: High-quality natural / neural Indian or English voices
  const preferredVoice = voices.find((v) =>
    (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google")) &&
    (v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("en-GB"))
  );
  if (preferredVoice) return preferredVoice;

  // 2. Second priority: Specific popular high-clarity voices
  const naturalNames = ["Neerja", "Prabhat", "Samantha", "Aria", "Jenny", "Guy", "Zira", "David", "Google UK English Female"];
  for (const name of naturalNames) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // 3. Third priority: Any English voice
  const englishVoice = voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) return englishVoice;

  return voices[0] || null;
}

interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  rate?: number;
  pitch?: number;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch {}
}

export function speakText(text: string, options: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    // Clean quotes or extra spaces
    const cleanText = text.replace(/^"|"$/g, "").trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const bestVoice = getBestVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Natural cadence parameters
    utterance.rate = options.rate ?? 0.94; // slightly relaxed for crystal-clear telecaller training
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      // "interrupted" or "canceled" are standard when changing slides
      activeUtterance = null;
      if (e.error !== "interrupted" && e.error !== "canceled") {
        options.onError?.();
      }
    };

    activeUtterance = utterance;

    // Workaround for Chrome voice loading
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voice = getBestVoice();
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.error("Speech synthesis failed", err);
    options.onError?.();
  }
}
