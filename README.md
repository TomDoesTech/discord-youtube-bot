# YouTube Discord bot

**Note:** The Discord NPM package requires Node 16 or higher. Make sure you run the this application with Node version 16 or higher. 

## Getting started
Move the `.env.template` file to a `.env` file and Update the credentials.

Register a Google OAuth application: https://console.cloud.google.com/apis/dashboard

Make a Discord application and add a bot: https://discord.com/developers/applications

Once you have added all the credentials, you can run the setup script `yarn setup`. This will register a /command with Discord and create a `tokens.json` file with your Google access tokens


