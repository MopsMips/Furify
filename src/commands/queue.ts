import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { FurifyClient } from '../core/client';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Zeigt die aktuelle Warteschlange'),

    async execute(interaction: ChatInputCommandInteraction) {
        const client = interaction.client as FurifyClient;
        const guildId = interaction.guildId!;
        const queue = client.player.getQueue(guildId);

        if (!queue || queue.tracks.length === 0) {
            await interaction.reply({
                content: '📭 Die Warteschlange ist leer.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const list = queue.tracks
            .slice(0, 10) // Max. 10 Einträge anzeigen
            .map((track, index) => `${index + 1}. [${track.title}](${track.url})`)
            .join('\n');

        await interaction.reply({
            content: `📃 **Aktuelle Warteschlange:**\n${list}`,
            flags: MessageFlags.Ephemeral,
        });
    },
};
