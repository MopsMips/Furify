import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command';
import { players } from '../core/player';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausiert die Musik'),

    async execute(interaction) {
        const guildId = interaction.guildId!;
        const player = players.get(guildId);

        if (!player) {
            await interaction.reply('⚠️ Es läuft gerade keine Musik.');
            return;
        }

        const success = player.pause();
        if (success) {
            await interaction.reply('⏸️ Wiedergabe pausiert.');
        } else {
            await interaction.reply('⚠️ Konnte die Wiedergabe nicht pausieren.');
        }
    }
};
