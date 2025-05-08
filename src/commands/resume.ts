import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { players } from '../core/player';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Setzt die Wiedergabe fort'),

    async execute(interaction: ChatInputCommandInteraction) {
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
