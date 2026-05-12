# pi-youtube-transcript

A [pi](https://pi.dev) extension that fetches YouTube video transcripts via the [`youtube-transcript`](https://github.com/Kakulukian/youtube-transcript) library.

## Install

```bash
pi install npm:pi-youtube-transcript
```

Then run `/reload` in pi (or restart).

## Usage

The extension registers a `youtube_transcript` tool that pi agents can call automatically whenever you ask about a YouTube video's content.

**Example prompt:**

> Summarize the transcript of https://youtube.com/watch?v=dQw4w9WgXcQ

Pi will call the tool, fetch the transcript, and work with it.

### Supported URL formats

- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/live/VIDEO_ID`
- Bare 11-character video IDs

### Language

By default the tool returns the first available transcript. To request a specific language, the agent will pass a `lang` parameter (ISO language code like `"en"`, `"es"`, `"fr"`).

## Development

```bash
git clone https://github.com/pi-packages/pi-youtube-transcript
cd pi-youtube-transcript
npm install
```

Test locally with pi:

```bash
pi -e .
# or
pi install /path/to/pi-youtube-transcript
```

## License

MIT
