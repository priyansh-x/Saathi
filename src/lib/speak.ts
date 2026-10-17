export function speakHindi(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const hindi =
    voices.find((v) => v.lang.toLowerCase().startsWith("hi")) ??
    voices.find((v) => /hindi/i.test(v.name));
  if (hindi) utter.voice = hindi;
  utter.lang = hindi?.lang || "hi-IN";
  utter.rate = 0.88;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
