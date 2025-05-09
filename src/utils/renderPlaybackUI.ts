import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    TextBasedChannel,
    Message,
    MessageComponentInteraction,
} from 'discord.js';
import { FurifyClient } from '../core/client';

function createProgressBar(current: number, total: number, length = 20): string {
    const percent = current / total;
    const filled = Math.round(length * percent);
    return `${'▓'.repeat(filled)}${'░'.repeat(length - filled)} ${formatTime(current)} / ${formatTime(total)}`;
}

function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export async function renderPlaybackUI(
    channel: TextBasedChannel & { send: (...args: any[]) => Promise<Message> },
    song: { title: string; url: string; duration: number },
    guildId: string,
    client: FurifyClient
): Promise<Message> {
    console.log(`[renderPlaybackUI] Starte UI für: ${song.title}`);
    console.log(`[renderPlaybackUI] Sende an Channel: ${channel.id} | Type: ${channel.type}`);

    const queue = client.player?.getQueue(guildId)?.tracks ?? [];

    const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle('🎶 Jetzt spielt:')
        .setDescription(`**[${song.title}](${song.url})**\n\n${createProgressBar(0, song.duration)}`)
        .setThumbnail(getYouTubeThumbnail(song.url) || '')
        .setFields({
            name: '🎵 Nächste Titel:',
            value: queue.length > 0
                ? queue.slice(0, 3).map((track, i) => `${i + 1}. [${track.title}](${track.url})`).join('\n')
                : 'Keine weiteren Titel in der Warteschlange.',
        })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('pause').setLabel('⏯ Pause/Play').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('skip').setLabel('⏭ Skip').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('stop').setLabel('⏹ Stop').setStyle(ButtonStyle.Danger),
    );

    let message: Message;

    if ('send' in channel && typeof channel.send === 'function') {
        try {
            message = await channel.send({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('❌ FEHLER beim Senden der UI-Nachricht:', error);
            throw error;
        }
    } else {
        throw new Error('❌ Der Channel unterstützt keine Nachrichten (kein .send vorhanden)');
    }

    let isPaused = false;
    let startTime = Date.now();
    let savedElapsedMs = 0;
    const updateInterval = 1_000;
    let interval: NodeJS.Timeout | null = null;

    function startProgressUpdater() {
        if (interval) return;
        interval = setInterval(async () => {
            const elapsedMs = isPaused ? savedElapsedMs : Date.now() - startTime;
            if (elapsedMs >= song.duration) {
                clearInterval(interval!);
                return;
            }

            const updatedEmbed = EmbedBuilder.from(embed)
                .setDescription(`**[${song.title}](${song.url})**\n\n${createProgressBar(elapsedMs, song.duration)}`)
                .setFields({
                    name: '🎵 Nächste Titel:',
                    value: client.player?.getQueue(guildId)?.tracks?.slice(0, 3)
                        .map((track, i) => `${i + 1}. [${track.title}](${track.url})`)
                        .join('\n') || 'Keine weiteren Titel in der Warteschlange.',
                });

            try {
                await message.edit({ embeds: [updatedEmbed] });
            } catch {
                clearInterval(interval!);
            }
        }, updateInterval);
    }

    function stopProgressUpdater() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }

    startProgressUpdater();

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 10 * 60 * 1000,
    });

    collector.on('collect', async (i: MessageComponentInteraction) => {
        try {
            switch (i.customId) {
                case 'pause':
                    await client.commands.get('pause')?.execute(i);
                    isPaused = !isPaused;
                    if (isPaused) {
                        savedElapsedMs = Date.now() - startTime;
                        stopProgressUpdater();
                    } else {
                        startTime = Date.now() - savedElapsedMs;
                        startProgressUpdater();
                    }
                    break;

                case 'skip':
                    await client.commands.get('skip')?.execute(i);
                    collector.stop();
                    stopProgressUpdater();
                    break;

                case 'stop':
                    await client.commands.get('stop')?.execute(i);
                    collector.stop();
                    stopProgressUpdater();
                    break;
            }
        } catch (err) {
            console.error('❌ Fehler bei Button-Interaktion:', err);
            if (!i.replied && !i.deferred) {
                try {
                    await i.reply({
                        content: '❌ Fehler bei der Button-Ausführung.',
                        flags: 64
                    });
                } catch (err: any) {
                    if (err.code === 10062) {
                        console.warn('⚠️ Interaktion war bereits abgelaufen (Unknown Interaction).');
                    } else {
                        console.error('❌ Fehler beim Senden der Fehlerantwort:', err);
                    }
                }
            }
        }
    });

    collector.on('end', stopProgressUpdater);

    client.botMessages ??= new Map();
    const existing = client.botMessages.get(guildId) ?? [];
    client.botMessages.set(guildId, [...existing, message]);

    client.uiMessages ??= new Map();
    client.uiMessages.set(guildId, message);

    return message;
}
