import { client } from '../core/client';
import { REST, Routes, Events, MessageFlags, Collection } from 'discord.js';
import { config } from 'dotenv';
import type { Command } from '../types/command';

// 🔁 Alle Commands als default-Exports importieren
import play from './play';
import skip from './skip';
import stop from './stop';
import pause from './pause';
import resume from './resume';
import queue from './queue';

config();

// ✅ Typisiertes Commands-Array
const commands = [play, skip, stop, pause, resume, queue] as Command[];

// 🔐 Commands im Client registrieren (wichtig für Buttons z. B. in play.ts)
client.commands = new Collection<string, Command>();
for (const command of commands) {
    client.commands.set(command.data.name, command);
}

// 🚀 Slash-Commands bei Bot-Start global registrieren
client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

    try {
        await rest.put(Routes.applicationCommands(client.user!.id), {
            body: commands.map(c => c.data.toJSON()),
        });

        console.log('✅ Slash Commands registriert!');
    } catch (error) {
        console.error('❌ Fehler beim Registrieren der Commands:', error);
    }
});

// 🎮 Command-Ausführung bei Interaktion
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) {
        console.warn(`⚠️ Befehl "${interaction.commandName}" nicht gefunden.`);
        return;
    }

    try {
        await cmd.execute(interaction);
    } catch (err) {
        console.error(`❌ Fehler bei /${interaction.commandName}:`, err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Fehler beim Ausführen.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
});
