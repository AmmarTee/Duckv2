# Duck Bot

Duck Bot is a playful Discord bot designed to drive engagement in your server through a virtual garden and a handful of kid‑style mini games.  Users earn coins and XP by watering plants, chatting in designated channels, and playing quick puzzles such as unscramble, fill‑the‑blank and quick math.  A simple economy lets users send coins to one another and refill their plant when it begins to wilt.  Everything is configured with slash commands under a single root: `/duck`.

This repository contains a production‑ready Node.js implementation built atop `discord.js` v14.  The bot runs in a single Docker container with a small volume for persistence.  Guild configuration and user state are stored in JSON files by default but can easily be swapped out for a database without modifying the business logic.

## Getting started

1. **Clone and prepare the environment.** Copy `.env.example` to `.env` and fill in your Discord application token, client ID and optional development guild ID (for faster command registration).

   ```sh
   cp .env.example .env
   # Edit .env to provide DISCORD_TOKEN, CLIENT_ID, TEST_GUILD_ID
   ```

2. **Build and run via Docker Compose.** The provided `docker-compose.yml` builds the image and mounts `./data` as a persistent volume.  The `TZ` variable controls the timezone used for daily reminders.

   ```sh
   docker compose up --build -d
   ```

3. **Register slash commands.** Once the container is running, execute the registration script.  Commands are registered globally by default; if `TEST_GUILD_ID` is set, they will be registered there instead for rapid iteration.

   ```sh
   docker compose exec duck-bot npm run register
   ```

4. **Configure channels in Discord.** Use the `/duck config` commands to point the garden and leaderboard panels at specific channels and specify which chat channels reward activity.

5. **Enjoy!** Try `/duck play unscramble` or `/duck play math` to kick off a game, `/duck coins daily` to claim a daily reward and `/duck garden post` to create the garden panel.  See `/duck about` for a quick summary of the bot’s capabilities.

## Development

To run the bot locally without Docker you can install dependencies and start the bot directly.  Node.js 20+ is required.

```sh
npm ci
npm start
```

Slash commands must still be registered before they will appear.  Use `npm run register` locally to register them against your test guild.

## File structure

The bot is organised into several layers:

- **src/index.js** – entry point that wires up the client, loads configuration and starts background jobs.
- **src/storage/** – simple JSON persistence with an abstraction (`repo.js`) to isolate consumers from the underlying storage format.
- **src/features/** – garden rendering, leaderboard rendering, economy helpers and game engines.
- **src/interactions/** – slash commands and component handlers.
- **src/jobs/** – scheduled tasks for water degradation and daily reminders.
- **src/util/** – common helpers for rendering, permissions and rate limiting.

The bot is intentionally modular.  Each feature lives in its own module and communicates through the repository API.  Adding a new game requires only dropping a new file into `src/features/games` that exports a `make()` function returning a puzzle object.

## Extending

The repository and service layers are deliberately simple.  If your server outgrows JSON storage, replace `src/storage/jsonStore.js` with a proper database driver (e.g. SQLite or PostgreSQL) while keeping the same repository interface.  New mini games can be added by adding a file under `src/features/games` that exports a `make` function returning `{ type, prompt, answer }`.

Contributions are welcome!  Feel free to fork the repository and customise the bot for your community.