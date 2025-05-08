import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    InteractionReplyOptions,
    MessageFlags
} from 'discord.js';
import { connections, players, queues } from '../core/player';
import { getVoiceConnection } from '@discordjs/voice';

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

        const guildId = guild.id;

        players.get(guildId)?.stop();
        queues.set(guildId, []);
        getVoiceConnection(guildId)?.destroy();

        players.delete(guildId);
        connections.delete(guildId);

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
