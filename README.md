# 🎵 Furify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/898088826134757426?label=Join%20Us%21&logo=discord)](https://discord.gg/6dzteBrQyg)

**Furify** is a modern, open-source Discord music bot designed to deliver seamless audio playback from Spotify and YouTube. Built with TypeScript and leveraging Discord.js, Furify offers high-quality streaming, intuitive commands, and a user-friendly experience for your Discord server.

## 🚀 Features

- 🎧 **Multi-Platform Support**: Stream music from both Spotify and YouTube.
- 🔍 **Smart Search**: Search and play tracks by name or URL.
- 📃 **Queue Management**: Add, remove, and shuffle songs in the queue.
- ⏯️ **Playback Controls**: Pause, resume, skip, and stop tracks with ease.
- 📈 **Now Playing**: Display the currently playing track.

## 🛠️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16.6.0 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [FFmpeg](https://ffmpeg.org/) installed and added to your system's PATH
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
- Spotify API credentials from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)

### Clone the Repository

```bash
git clone https://github.com/MopsMips/Furify.git
cd Furify
```

### Install Dependencies

Using npm:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

### Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```env
DISCORD_TOKEN=your_discord_bot_token
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Build the Bot

```bash
npm run build
```

### Start the Bot

```bash
npm start
```

## 📚 Commands

- `/play [song name or URL]` - Play a song from Spotify or YouTube.
- `/pause` - Pause the current track.
- `/resume` - Resume playback.
- `/skip` - Skip to the next track in the queue.
- `/stop` - Stop playback and clear the queue.
- `/queue` - View the current song queue.

*Note: Replace `/` with your configured command prefix if different.*

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
