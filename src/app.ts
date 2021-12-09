require("dotenv").config();
import Discord, { Intents } from "discord.js";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { Tokens } from "./types/app";

const tokens: Tokens = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../tokens.json"), {
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

const client = new Discord.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

async function getVideoStats({ videoId }: { videoId: string }) {
  const { data } = await yt.videos.list({
    part: ["snippet", "statistics"],
    id: [videoId],
  });

  if (!data.items) return `Could not find a video with the id ${videoId}`;

  const video = data?.items[0];

  if (!video) {
    return `Could not find video with ID ${videoId}. Copy the ID from the video URL.`;
  }

  const likes = parseInt(video.statistics?.likeCount || "0", 10);

  const dislikes = parseInt(video.statistics?.dislikeCount || "0", 10);

  const total = likes + dislikes;

  const ratio = Math.round((likes / total) * 100 * 10) / 10;

  const views = parseInt(video.statistics?.viewCount || "0", 10).toLocaleString(
    "en-us"
  );

  return `${video.snippet?.title}\n\n👍 Likes: ${likes}\n\n👎 Dislikes: ${dislikes}\n\n📈 Ratio: ${ratio}%\n\n👀 Views: ${views}\n\n💬 Comments: ${video.statistics?.commentCount}\n https://youtube.com/watch?v=${videoId}`;
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName, options } = interaction;

  if (commandName === "stats") {
    const videoId = options.getString("video");

    const res = videoId
      ? await getVideoStats({ videoId })
      : "Please provide a video ID";

    interaction.reply(res);
  }
});
