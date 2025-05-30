import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    TextChannel
} from 'discord.js';
import { FurifyClient } from '../core/client';

type AnyInteraction = ChatInputCommandInteraction | MessageComponentInteraction;

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Überspringt den aktuellen Song'),

    async execute(interaction: AnyInteraction) {
        const guild = interaction.guild;
        if (!guild) return;

        const client = interaction.client as FurifyClient;
        const success = client.player.skip(guild.id);

        if (interaction.isMessageComponent()) {
            await interaction.deferUpdate();
        } else {
            await interaction.reply({
                content: success
                    ? '⏭️ Song wurde übersprungen.'
                    : '⚠️ Es läuft gerade keine Musik.',
                ephemeral: true,
            });
        }

        if (success && interaction.channel && interaction.channel instanceof TextChannel) {
            try {
                await interaction.channel.send('⏭️ **Song wurde übersprungen!**');
            } catch (e) {
                console.warn('⚠️ Konnte öffentliche Skip-Nachricht nicht senden:', e);
            }
        }
    },
};
