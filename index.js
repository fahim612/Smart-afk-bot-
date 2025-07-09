const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const { pathfinder, goals: { GoalBlock } } = require('mineflayer-pathfinder');
const config = require('./settings.json');
const express = require('express');

const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("✅ Express server started"));

function createBot() {
  const bot = mineflayer.createBot({
    host: config.server.ip,
    port: config.server.port,
    username: config['bot-account'].username,
    password: config['bot-account'].password,
    auth: config['bot-account'].type,
    version: config.server.version
  });

  bot.loadPlugin(pathfinder);
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);

  bot.once('spawn', () => {
    console.log("✅ Bot joined server");

    // AFK movement
    if (config.utils['anti-afk'].enabled) {
      bot.setControlState('jump', true);
      if (config.utils['anti-afk'].sneak) {
        bot.setControlState('sneak', true);
      }
      setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
      }, 30000);
    }

    if (config.utils['chat-messages'].enabled) {
      const msgs = config.utils['chat-messages'].messages;
      let i = 0;
      setInterval(() => {
        bot.chat(msgs[i]);
        i = (i + 1) % msgs.length;
      }, config.utils['chat-messages']['repeat-delay'] * 1000);
    }

    if (config.position.enabled) {
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(config.position.x, config.position.y, config.position.z));
    }
  });

  bot.on("end", () => {
    if (config.utils['auto-reconnect']) {
      console.log("⚠️ Bot disconnected. Reconnecting...");
      setTimeout(createBot, config.utils['auto-reconnect-delay']);
    }
  });

  bot.on("error", err => {
    console.error("❌ Error:", err.message);
  });

  bot.on("kicked", reason => {
    console.warn("⚠️ Kicked:", reason);
  });
}

createBot();

// Self-ping using dynamic import for ESM compatibility
setInterval(() => {
  import('node-fetch').then(fetch => {
    fetch.default("https://<your-replit-project-name>.<your-username>.repl.co")
      .then(() => console.log("✅ Self-ping sent"))
      .catch(err => console.error("❌ Self-ping failed:", err));
  });
}, 4 * 60 * 1000);
