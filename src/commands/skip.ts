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
        .setName('skip')
        .setDescription('Überspringt den aktuellen Song'),

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

        player.stop(); // Springt zum nächsten Song (falls vorhanden)

        const response: InteractionReplyOptions = {
            content: '⏭️ Song übersprungen!',
            flags: MessageFlags.Ephemeral
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    },
};
