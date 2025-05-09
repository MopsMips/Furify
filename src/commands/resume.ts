import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { FurifyClient } from '../core/client';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Setzt die Wiedergabe fort'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({
                content: '❌ Fehler: Kein Server gefunden.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const client = interaction.client as FurifyClient;
        const success = client.player.resume(guild.id);

        if (success) {
            await interaction.reply({
                content: '▶️ Wiedergabe fortgesetzt.',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: '⚠️ Wiedergabe konnte nicht fortgesetzt werden.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};