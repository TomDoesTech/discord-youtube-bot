import { getVideoIdFromMessage } from "../youtube";

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
