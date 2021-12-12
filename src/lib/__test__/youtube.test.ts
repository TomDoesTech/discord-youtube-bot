import { getVideoIdFromMessage, getVideoStats } from "../youtube";

describe("youtube", () => {
  const videoId = "a_N3ixrB2rY";

  it("should get the videoID from full urls", () => {
    expect(
      getVideoIdFromMessage({
        // @ts-ignore
        message: {
          content: `https://www.youtube.com/watch?v=${videoId}&ab_channel=TomDoesTech`,
        },
      })
    ).toBe(videoId);
  });

  it("should get the videoID from short urls", () => {
    expect(
      getVideoIdFromMessage({
        // @ts-ignore
        message: {
          content: `https://youtu.be/${videoId}`,
        },
      })
    ).toBe(videoId);
  });
});

describe("Format message", () => {
  const videoId = "NGxVLnJKhP8";

  it("should format with disabled error if likes are disabled", async () => {
    const video = await getVideoStats({ videoId, isReplyToMessage: false });
    expect(video.includes("Disabled by the video creator")).toBe(true);
  });

  it("should not show video link on reply messages", async () => {
    const video = await getVideoStats({ videoId, isReplyToMessage: true });
    expect(video.includes("https://youtu.be/")).toBe(false);
  });
});
