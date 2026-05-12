import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// Import helpers from the extension
import { extractVideoId, formatOffset } from "../index.ts";

// Import the real TranscriptResponse type
import type { TranscriptResponse } from "youtube-transcript";

// ── extractVideoId ──────────────────────────────────────────────

describe("extractVideoId", () => {
  it("passes through a bare 11-char video ID", () => {
    assert.equal(extractVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });

  it("extracts ID from youtube.com/watch?v= URL", () => {
    assert.equal(
      extractVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from www.youtube.com/watch?v= URL", () => {
    assert.equal(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtu.be/ URL", () => {
    assert.equal(
      extractVideoId("https://youtu.be/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtube.com/shorts/ URL", () => {
    assert.equal(
      extractVideoId("https://youtube.com/shorts/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtube.com/live/ URL", () => {
    assert.equal(
      extractVideoId("https://www.youtube.com/live/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from URL with extra query params", () => {
    assert.equal(
      extractVideoId(
        "https://youtube.com/watch?v=dQw4w9WgXcQ&t=30&ab_channel=foo",
      ),
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from embedded player URL", () => {
    assert.equal(
      extractVideoId("https://youtube.com/embed/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ",
    );
  });

  it("passes through unrecognized input (will let library throw)", () => {
    // Shouldn't crash — just returns input as-is
    assert.equal(extractVideoId("not-a-video"), "not-a-video");
  });
});

// ── formatOffset ────────────────────────────────────────────────

describe("formatOffset", () => {
  it("formats seconds as [M:SS]", () => {
    assert.equal(formatOffset(0), "[0:00]");
    assert.equal(formatOffset(5000), "[0:05]");
    assert.equal(formatOffset(65000), "[1:05]");
    assert.equal(formatOffset(60000), "[1:00]");
  });

  it("formats hours as [H:MM:SS]", () => {
    assert.equal(formatOffset(3600000), "[1:00:00]");
    assert.equal(formatOffset(3661000), "[1:01:01]");
  });

  it("rounds down (floor)", () => {
    assert.equal(formatOffset(1500), "[0:01]");
  });
});

// ── Tool execute (integration via mock) ─────────────────────────

describe("tool execution (mocked)", () => {
  it("formats transcript segments into text and returns details", async () => {
    // Simulate the tool's execute logic directly
    const fixture: TranscriptResponse[] = (
      await import("./fixtures/transcript-response.json", {
        with: { type: "json" },
      })
    ).default;

    const videoId = "dQw4w9WgXcQ";
    const segments = fixture;

    const text = segments
      .map((s) => `${formatOffset(s.offset)} ${s.text}`)
      .join("\n");

    // Verify the joined text looks right
    assert.match(text, /\[0:00\] Never gonna give you up/);
    assert.match(text, /\[0:05\] Never gonna let you down/);
    assert.match(text, /\[0:22\] Never gonna say goodbye/);

    // Verify details structure matches spec
    const details = {
      videoId,
      language: segments[0]?.lang ?? undefined,
      segments: segments.map((s) => ({
        text: s.text,
        duration: s.duration,
        offset: s.offset,
      })),
    };

    assert.equal(details.videoId, "dQw4w9WgXcQ");
    assert.equal(details.language, "en");
    assert.equal(details.segments.length, 6);
    assert.equal(details.segments[0].text, "Never gonna give you up");
  });
});
