import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    InteractionReplyOptions,
    MessageFlags
} from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { FurifyClient } from '../core/client';

type AnyInteraction = ChatInputCommandInteraction | MessageComponentInteraction;

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stoppt die Musik und leert die Warteschlange'),

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
        if (player) player.stop();

        client.player.clearQueue(guildId);
        getVoiceConnection(guildId)?.destroy();

        // Optional: player + connection löschen, falls du das manuell brauchst
        (client.player as any).players?.delete(guildId);
        (client.player as any).connections?.delete(guildId);

        const response: InteractionReplyOptions = {
            content: '⏹️ Musik gestoppt und Warteschlange geleert.',
            flags: MessageFlags.Ephemeral
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    },
};
