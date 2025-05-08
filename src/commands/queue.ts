import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command';
import { queues } from '../core/player';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Zeigt die aktuelle Warteschlange'),

    async execute(interaction) {
        const guildId = interaction.guildId!;
        const queue = queues.get(guildId);

        if (!queue || queue.length === 0) {
            await interaction.reply('📭 Die Warteschlange ist leer.');
            return;
        }

        const list = queue
            .map((url, index) => `${index + 1}. ${url}`)
            .slice(0, 10) // optional: Max. 10 Einträge anzeigen
            .join('\n');

        await interaction.reply(`📃 **Aktuelle Warteschlange:**\n${list}`);
    },
};
