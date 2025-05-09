import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    Message
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

        const messages = await interaction.channel?.messages.fetch();
        if (messages) {
            const botMessages = messages.filter(
                (msg: Message) => msg.author.id === client.user?.id
            );

            for (const msg of botMessages.values()) {
                try {
                    await msg.delete();
                } catch (err) {
                    console.warn('⚠️ Konnte Bot-Nachricht nicht löschen:', err);
                }
            }
        }

        const player = (client.player as any).players?.get(guildId);
        if (player) {
            player.stop();
        }

        client.player.clearQueue(guildId);

        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
        }

        (client.player as any).players?.delete(guildId);
        (client.player as any).connections?.delete(guildId);

        if (interaction.isMessageComponent()) {
            await interaction.deferUpdate();
        } else {
            await interaction.reply({
                content: '⏹️ Musik gestoppt und Warteschlange geleert. Alle Bot-Nachrichten wurden gelöscht.',
                ephemeral: true,
            });
        }
    },
};
