import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    TextBasedChannel
} from 'discord.js';
import { getSongFromUrl } from '../utils/yt-dlp';
import { FurifyClient } from '../core/client';
import {
    handleSpotifyPlaylist,
    handleSpotifyAlbum,
    handleSpotifyTrack
} from '../modules/spotifyHandler';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Spielt einen Song, ein Album oder eine Playlist von YouTube oder Spotify ab')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube- oder Spotify-Link')
                .setRequired(true),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);
        const member = interaction.member as any;
        const voiceChannel = member?.voice?.channel;
        const client = interaction.client as FurifyClient;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Du musst in einem Sprachkanal sein!',
                flags: MessageFlags.Ephemeral
            });
        }

        const textChannel = interaction.channel?.isTextBased()
            ? interaction.channel as TextBasedChannel
            : undefined;

        let urls: string[] | null = null;

        try {
            if (url.includes('spotify.com/playlist')) {
                await interaction.reply({ content: '🔄 Lade Spotify-Playlist...' });
                urls = await handleSpotifyPlaylist(url);
            } else if (url.includes('spotify.com/album')) {
                await interaction.reply({ content: '🔄 Lade Spotify-Album...' });
                urls = await handleSpotifyAlbum(url);
            } else if (url.includes('spotify.com/track')) {
                await interaction.reply({ content: '🔄 Lade Spotify-Track...' });
                urls = await handleSpotifyTrack(url);
            }

            if (urls) {
                if (!urls.length) {
                    return interaction.followUp({ content: '⚠️ Keine Songs gefunden.' });
                }

                for (const ytUrl of urls) {
                    await client.player.connectAndPlay(
                        voiceChannel,
                        ytUrl,
                        interaction.guildId!,
                        textChannel
                    );
                }

                return interaction.followUp({ content: `✅ ${urls.length} Songs wurden zur Warteschlange hinzugefügt.` });
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Fehler beim Verarbeiten des Spotify-Links.' });
        }

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
