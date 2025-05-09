import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    InteractionReplyOptions,
    MessageFlags,
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
        if (!guild) {
            return interaction.reply({
                content: '❌ Fehler: Kein Server gefunden.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const client = interaction.client as FurifyClient;
        const success = client.player.skip(guild.id);

        const ephemeralResponse: InteractionReplyOptions = {
            content: success ? '⏭️ Song wurde übersprungen.' : '⚠️ Es läuft gerade keine Musik.',
            flags: MessageFlags.Ephemeral,
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(ephemeralResponse);
        } else {
            await interaction.reply(ephemeralResponse);
        }

        // Öffentliche Info bei Erfolg senden
        if (success && interaction.channel && interaction.channel instanceof TextChannel) {
            try {
                await interaction.channel.send('⏭️ **Song wurde übersprungen!**');
            } catch (e) {
                console.warn('⚠️ Konnte öffentliche Skip-Nachricht nicht senden:', e);
            }
        }
    },
};
