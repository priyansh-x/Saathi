"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExamplePill } from "@/components/family/chrome";
import { PhonePreview } from "@/components/demo/phone-preview";
import type { Lang } from "@/lib/i18n/messages";
import {
  type RecordScene,
  stepRecordIndex,
  visibleRecordLines,
} from "@/lib/demo-record";

export function RecordPlayer({ lang, scenes }: { lang: Lang; scenes: RecordScene[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState(true);
  const started = useRef(0);
  const elapsedRef = useRef(0);
  const scene = scenes[index];

  const go = useCallback((next: number) => {
    setIndex(next);
    setElapsed(0);
    elapsedRef.current = 0;
    started.current = performance.now();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("record");
    const hide = window.setTimeout(() => setHint(false), 4000);
    return () => {
      document.documentElement.classList.remove("record");
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((p) => {
          if (p) started.current = performance.now() - elapsedRef.current;
          return !p;
        });
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(stepRecordIndex(index, 1, scenes.length));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(stepRecordIndex(index, -1, scenes.length));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, scenes.length]);

  useEffect(() => {
    if (paused || !scene) return;
    if (!started.current) started.current = performance.now();
    const id = window.setInterval(() => {
      const next = performance.now() - started.current;
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= scene.ms && index < scenes.length - 1) {
        go(index + 1);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [paused, scene, index, scenes.length, go]);

  if (!scene) return null;
  const lines = scene.lines ? visibleRecordLines(scene.lines, elapsed) : [];

  return (
    <div className="record-stage">
      <header className="record-bar">
        <ExamplePill lang={lang} />
        <h1 className="record-title">{scene.title}</h1>
        <span className="record-progress" aria-hidden>
          {index + 1}/{scenes.length}
          {paused ? " · pause" : ""}
        </span>
      </header>

      <section className="record-body" aria-live="polite">
        {scene.kind === "call" ? (
          <ol className="record-lines">
            {lines.map((line, i) => (
              <li key={`${line.atMs}-${i}`} className="record-line">
                <p className="record-speaker">{line.speaker === "agent" ? "Saathi" : "Kamla"}</p>
                <p className="font-devanagari record-hi">{line.hi}</p>
                <p className="record-en">{line.en}</p>
              </li>
            ))}
          </ol>
        ) : null}

        {scene.meds ? (
          <ul className="record-meds">
            {scene.meds.map((row) => (
              <li key={row.name} className="record-med">
                <span>{row.name}</span>
                <span className="record-pill">{row.status}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {scene.body ? <p className="record-copy">{scene.body}</p> : null}

        {scene.wa?.length ? (
          <div className="record-wa">
            {scene.wa.map((card) => (
              <PhonePreview key={card.title} title={card.title} body={card.body} />
            ))}
          </div>
        ) : null}

        {scene.kind === "summary" ? (
          <p className="record-summary-mark" aria-hidden>
            EXAMPLE
          </p>
        ) : null}

        {scene.footer ? <p className="record-footer">{scene.footer}</p> : null}
      </section>

      {hint ? <p className="record-hint">Space pauses · arrows step · EXAMPLE</p> : null}
    </div>
  );
}
