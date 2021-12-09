import { google, youtube_v3 } from "googleapis";
import fs from "fs";
import path from "path";
import { Tokens } from "../types/app";

const tokens: Tokens = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd() + "/tokens.json"), {
    encoding: "utf8",
  })
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "http://localhost:3000"
);

oauth2Client.setCredentials(tokens);

const yt = google.youtube({ version: "v3", auth: oauth2Client });

function formatVideoData(video: youtube_v3.Schema$Video) {
  const likes = parseInt(video.statistics?.likeCount || "0", 10);

  const dislikes = parseInt(video.statistics?.dislikeCount || "0", 10);

  const total = likes + dislikes;

  const ratio = Math.round((likes / total) * 100 * 10) / 10;

  const views = parseInt(video.statistics?.viewCount || "0", 10).toLocaleString(
    "en-us"
  );

  const title = video.snippet?.title;

  const commentCount = video.statistics?.commentCount;

  return { likes, dislikes, ratio, views, title, commentCount };
}

export async function getVideoStats({
  videoId,
  isReplyToMessage = false,
}: {
  videoId: string;
  isReplyToMessage?: boolean;
}) {
  const { data } = await yt.videos.list({
    part: ["snippet", "statistics"],
    id: [videoId],
  });

  if (!data.items) return `Could not find a video with the id ${videoId}`;

  const video = data?.items[0];

  if (!video) {
    return `Could not find video with ID ${videoId}. Copy the ID from the video URL.`;
  }

  const { views, likes, dislikes, commentCount, ratio, title } =
    formatVideoData(video);

  if (isReplyToMessage) {
    return `${title}\n\n👍 Likes: ${likes}\n\n👎 Dislikes: ${dislikes}\n\n📈 Ratio: ${ratio}%\n\n👀 Views: ${views}\n\n💬 Comments: ${commentCount}`;
  }

  return `${title}\n\n👍 Likes: ${likes}\n\n👎 Dislikes: ${dislikes}\n\n📈 Ratio: ${ratio}%\n\n👀 Views: ${views}\n\n💬 Comments: ${commentCount}\n https://youtube.com/watch?v=${videoId}`;
}

const ytVideoRegExp =
  /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

export function ytUrlParser(url: string): string | null {
  const match = url.match(ytVideoRegExp);

  if (match && match[7].length == 11) {
    return match[7];
  }

  return null;
}
