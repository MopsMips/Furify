import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command';
import { players } from '../core/player';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Setzt die Wiedergabe fort'),

    async execute(interaction) {
        const guildId = interaction.guildId!;
        const player = players.get(guildId);

        if (!player) {
            await interaction.reply('⚠️ Es läuft gerade keine Musik.');
            return;
        }

        const success = player.unpause();

        if (success) {
            await interaction.reply('▶️ Wiedergabe fortgesetzt.');
        } else {
            await interaction.reply('⚠️ Wiedergabe konnte nicht fortgesetzt werden.');
        }
    },
};
