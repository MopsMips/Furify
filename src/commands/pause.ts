import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    InteractionReplyOptions,
    MessageFlags
} from 'discord.js';
import { players } from '../core/player';

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

        const player = players.get(guild.id);
        if (!player) {
            return interaction.reply({
                content: '⚠️ Es läuft gerade keine Musik.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Hier prüfen: ist bereits pausiert?
        let message = '';
        if (player.state.status === 'paused') {
            const success = player.unpause?.(); // oder resume(), je nach Implementierung
            message = success ? '▶️ Wiedergabe fortgesetzt.' : '⚠️ Konnte die Wiedergabe nicht fortsetzen.';
        } else {
            const success = player.pause();
            message = success ? '⏸️ Wiedergabe pausiert.' : '⚠️ Konnte die Wiedergabe nicht pausieren.';
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
