import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
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
        if (!guild) return;

        const client = interaction.client as FurifyClient;
        const guildId = guild.id;

        const uiMessage = client.uiMessages?.get(guildId);
        if (uiMessage && uiMessage.deletable) {
            try {
                await uiMessage.delete();
            } catch (err) {
                console.warn('⚠️ Konnte UI-Nachricht nicht löschen:', err);
            }
        }
        client.uiMessages?.delete(guildId);

        const player = (client.player as any).players?.get(guildId);
        if (player) player.stop();

        client.player.clearQueue(guildId);
        getVoiceConnection(guildId)?.destroy();

        (client.player as any).players?.delete(guildId);
        (client.player as any).connections?.delete(guildId);

        if (interaction.isMessageComponent()) {
            await interaction.deferUpdate();
        } else {
            await interaction.reply({
                content: '⏹️ Musik gestoppt und Warteschlange geleert.',
                ephemeral: true,
            });
        }
    },
};
