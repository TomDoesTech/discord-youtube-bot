import dotenv from "dotenv";
import { google } from "googleapis";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { SlashCommandBuilder } from "@discordjs/builders";
import express from "express";
import open from "open";
import fs from "fs";

dotenv.config();

const port = process.env.PORT || 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  `http://localhost:${port}`
);

function run() {
  // generate a url that asks permissions for Blogger and Google Calendar scopes
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/youtube.readonly",
  ];

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",

    // If you only need one scope you can pass it as a string
    scope: scopes,
  });

  open(url);
}

const app = express();

app.get("/", async (req, res) => {
  console.log("got callback", req.query);

  const { tokens } = await oauth2Client.getToken(req.query.code);
  console.log({ tokens });

  res.send(true);

  fs.writeFileSync("tokens.json", JSON.stringify(tokens));

  process.exit();
});

// Add command
const data = new SlashCommandBuilder()
  .setName("stats") // <-- The command that will be used in Discord
  .setDescription("Replies with a video statistics")
  .addStringOption((option) =>
    option.setName("video").setDescription("The video ID").setRequired(true)
  );
const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD
      ),
      {
        body: [data],
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

app.listen(port, () => {
  console.log("Waiting for callback...");
  run();
});
