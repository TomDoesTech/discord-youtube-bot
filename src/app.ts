require("dotenv").config();
import { get } from "lodash";
import Discord, { Intents, MessageEvent } from "discord.js";
import { getVideoStats, ytUrlParser } from "./lib/youtube";

const client = new Discord.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on<string>("messageCreate", async function (message) {
  const embeddedUrl = get(message, "embeds[0].url");

  const videoId = embeddedUrl ? ytUrlParser(embeddedUrl) : null;

  if (videoId) {
    const res = videoId
      ? await getVideoStats({ videoId, isReplyToMessage: true })
      : "Please provide a video ID";

    message.reply(res);
  }
});

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
