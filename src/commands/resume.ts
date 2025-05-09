import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
} from 'discord.js';
import { FurifyClient } from '../core/client';

type AnyInteraction = ChatInputCommandInteraction | MessageComponentInteraction;

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Setzt die Wiedergabe fort'),

    async execute(interaction: AnyInteraction) {
        const guild = interaction.guild;
        if (!guild) return;

        const client = interaction.client as FurifyClient;
        const success = client.player.resume(guild.id);

        if (interaction.isMessageComponent()) {
            await interaction.deferUpdate();
        } else {
            await interaction.reply({
                content: success
                    ? '▶️ Wiedergabe fortgesetzt.'
                    : '⚠️ Wiedergabe konnte nicht fortgesetzt werden.',
                ephemeral: true,
            });
        }
    },
};
