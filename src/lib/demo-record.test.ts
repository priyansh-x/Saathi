import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoAudioUrl } from "./config";
import {
  RECORD_LINE_MS,
  RECORD_SCENE_IDS,
  buildRecordScenes,
  scaleLineTimes,
  stepRecordIndex,
  visibleRecordLines,
} from "./demo-record";

describe("demo record mode", () => {
  it("walks call, medicines, briefing, alert, I'm going, Maa is OK, then a calm summary", () => {
    const scenes = buildRecordScenes("en");
    assert.deepEqual(
      scenes.map((s) => s.id),
      [...RECORD_SCENE_IDS],
    );
    assert.ok(scenes.every((s) => s.ms >= 2800));
    assert.ok(scenes[0]?.lines && scenes[0].lines.length >= 4);
    assert.match(JSON.stringify(scenes), /EXAMPLE/);
    assert.match(scenes.at(-1)?.footer ?? "", /112/);
    const hi = buildRecordScenes("hi");
    assert.equal(hi.length, scenes.length);
    assert.match(hi[0]?.title ?? "", /कॉल/);
  });

  it("keeps arrow steps in range and reveals transcript by beat time", () => {
    assert.equal(stepRecordIndex(0, -1, 7), 0);
    assert.equal(stepRecordIndex(6, 1, 7), 6);
    assert.equal(stepRecordIndex(2, 1, 7), 3);
    const lines = buildRecordScenes("en")[0]!.lines!;
    assert.equal(visibleRecordLines(lines, 0).length, 1);
    assert.ok(visibleRecordLines(lines, 10_000).length > 1);
    assert.equal(visibleRecordLines(lines, 99_000).length, lines.length);
  });

  it("accepts an optional http(s) DEMO_AUDIO_URL and scales beats to its length", () => {
    assert.equal(demoAudioUrl(""), "");
    assert.equal(demoAudioUrl("javascript:alert(1)"), "");
    assert.equal(demoAudioUrl("https://example.test/kamla-EXAMPLE.mp3"), "https://example.test/kamla-EXAMPLE.mp3");
    const lines = buildRecordScenes("en")[0]!.lines!;
    const scaled = scaleLineTimes(lines, 20_000);
    assert.equal(scaled.length, lines.length);
    assert.ok((scaled.at(-1)?.atMs ?? 0) < 20_000);
    assert.equal(scaleLineTimes(lines, 0)[0]?.atMs, lines[0]?.atMs);
    assert.equal(RECORD_LINE_MS, 2800);
  });
});
