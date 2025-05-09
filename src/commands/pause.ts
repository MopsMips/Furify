import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
} from 'discord.js';
import { FurifyClient } from '../core/client';

type AnyInteraction = ChatInputCommandInteraction | MessageComponentInteraction;

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausiert oder setzt die Musik fort'),

    async execute(interaction: AnyInteraction) {
        const guild = interaction.guild;
        if (!guild) return;

        const client = interaction.client as FurifyClient;
        const guildId = guild.id;
        const player = (client.player as any).players?.get(guildId);

        if (!player) {
            if (interaction.isMessageComponent()) {
                await interaction.deferUpdate();
            } else {
                await interaction.reply({ content: '⚠️ Es läuft gerade keine Musik.', ephemeral: true });
            }
            return;
        }

        const status = player.state.status;

        if (status === 'paused') {
            client.player.resume(guildId);
        } else if (status === 'playing') {
            client.player.pause(guildId);
        }

        if (interaction.isMessageComponent()) {
            await interaction.deferUpdate();
        } else {
            await interaction.reply({ content: '⏯️ Wiedergabe geändert.', ephemeral: true });
        }
    }
};
