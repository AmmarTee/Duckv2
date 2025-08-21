import { REST, Routes } from 'discord.js';
import { clientId, token, testGuildId } from './config.js';
import { data as commandData } from './interactions/commands.js';

const commands = [commandData.toJSON()];

const rest = new REST({ version: '10' }).setToken(token);

async function register() {
  try {
    if (testGuildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, testGuildId),
        { body: commands }
      );
      console.log(`Registered slash commands for guild ${testGuildId}`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Registered slash commands globally');
    }
  } catch (err) {
    console.error(err);
  }
}

register();