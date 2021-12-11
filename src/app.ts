require("dotenv").config();
import { get } from "lodash";
import Discord, { Intents } from "discord.js";
import { getVideoStats, getVideoIdFromMessage } from "./lib/youtube";
import logger from "./lib/logger";

const client = new Discord.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  logger.info(`Logged in as ${client.user?.tag}!`);
});

client.on<string>("messageCreate", async function (message) {
  const videoId = getVideoIdFromMessage({ message });

  if (videoId) {
    logger.info(`Fetching data video with ID ${videoId}`);

    try {
      const res = videoId
        ? await getVideoStats({ videoId, isReplyToMessage: true })
        : "Please provide a video ID";
      message.reply(res);
    } catch (e) {
      logger.error(e, `Error getting video by id ${videoId}`);
    }
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
