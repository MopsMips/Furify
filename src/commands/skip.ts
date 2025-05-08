import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command';
import { players } from '../core/player';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Überspringt den aktuellen Song'),

    async execute(interaction) {
        const guildId = interaction.guildId!;
        const player = players.get(guildId);

        if (!player) {
            await interaction.reply('⚠️ Es läuft gerade keine Musik.');
            return;
        }

        player.stop(); // stop() löst playNext() automatisch aus
        await interaction.reply('⏭️ Song übersprungen!');
    },
};
