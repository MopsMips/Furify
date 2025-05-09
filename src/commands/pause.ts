import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    InteractionReplyOptions,
    MessageFlags
} from 'discord.js';
import { FurifyClient } from '../core/client';

type AnyInteraction = ChatInputCommandInteraction | MessageComponentInteraction;

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausiert oder setzt die Musik fort'),

    async execute(interaction: AnyInteraction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({
                content: '❌ Fehler: Kein Server gefunden.',
                flags: MessageFlags.Ephemeral
            });
        }

        const client = interaction.client as FurifyClient;
        const guildId = guild.id;
        const player = (client.player as any).players?.get(guildId);

        if (!player) {
            return interaction.reply({
                content: '⚠️ Es läuft gerade keine Musik.',
                flags: MessageFlags.Ephemeral
            });
        }

        const status = player.state.status;
        let message = '';

        if (status === 'paused') {
            const resumed = client.player.resume(guildId);
            message = resumed ? '▶️ Wiedergabe fortgesetzt.' : '⚠️ Konnte nicht fortsetzen.';
        } else if (status === 'playing') {
            const paused = client.player.pause(guildId);
            message = paused ? '⏸️ Wiedergabe pausiert.' : '⚠️ Konnte nicht pausieren.';
        } else {
            message = '⚠️ Keine Wiedergabe aktiv.';
        }

        const response: InteractionReplyOptions = {
            content: message,
            flags: MessageFlags.Ephemeral
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
};
