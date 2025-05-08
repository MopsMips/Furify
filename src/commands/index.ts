import { client } from '../core/client';
import { REST, Routes, Events } from 'discord.js';
import { config } from 'dotenv';

// 🔁 Alle Commands importieren
import { command as play } from './play';
import { command as skip } from './skip';
import { command as stop } from './stop';
import { command as pause } from './pause';
import { command as resume } from './resume';
import { command as queue } from './queue';

config();

// ➕ Alle Commands in die Liste aufnehmen
const commands = [play, skip, stop, pause, resume, queue];


client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
    await rest.put(Routes.applicationCommands(client.user!.id), {
        body: commands.map(c => c.data.toJSON()),
    });
    console.log('✅ Slash Commands registriert!');
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = commands.find(c => c.data.name === interaction.commandName);
    if (cmd) {
        try {
            await cmd.execute(interaction);
        } catch (err) {
            console.error(`Fehler bei /${interaction.commandName}:`, err);
            await interaction.reply({ content: '❌ Fehler beim Ausführen.', ephemeral: true });
        }
    }
});