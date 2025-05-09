import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    TextBasedChannel
} from 'discord.js';
import { getSongFromUrl } from '../utils/yt-dlp';
import { FurifyClient } from '../core/client';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Spielt einen Song von YouTube ab')
        .addStringOption(option =>
            option.setName('url').setDescription('YouTube-URL des Songs').setRequired(true),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);
        const member = interaction.member as any;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Du musst in einem Sprachkanal sein!',
                flags: MessageFlags.Ephemeral
            });
        }

        const client = interaction.client as FurifyClient;
        await interaction.reply({ content: '🔄 Lade den Song...' });
        const loadingMessage = await interaction.fetchReply();


        const existing = client.botMessages.get(interaction.guildId!) ?? [];
        client.botMessages.set(interaction.guildId!, [...existing, loadingMessage]);

        let song;
        try {
            const fetched = await getSongFromUrl(url);
            if (!fetched) throw new Error();
            song = fetched;
        } catch {
            const errorMsg = await interaction.followUp({ content: '❌ Fehler beim Laden des Songs.' });
            client.botMessages.set(interaction.guildId!, [...(client.botMessages.get(interaction.guildId!) ?? []), errorMsg]);
            return;
        }

        const textChannel = interaction.channel?.isTextBased()
            ? interaction.channel as TextBasedChannel
            : undefined;

        const result = await client.player.connectAndPlay(
            voiceChannel,
            url,
            interaction.guildId!,
            textChannel
        );

        if (result === 'queued') {
            await loadingMessage.delete();
            const queueMsg = await interaction.followUp({
                content: `📥 **${song.title}** wurde zur Warteschlange hinzugefügt.`,
            });
            client.botMessages.set(interaction.guildId!, [...(client.botMessages.get(interaction.guildId!) ?? []), queueMsg]);
            return;
        }

        await loadingMessage.delete();
        return;
    },
};
