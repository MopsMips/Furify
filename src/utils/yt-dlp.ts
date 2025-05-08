import { spawn, ChildProcess, execFile } from 'child_process';

export const ytDlpPath = 'C:/Users/Eileen/AppData/Local/Programs/Python/Python313/Scripts/yt-dlp.exe';

export function getYtDlpStream(url: string): ChildProcess {
    return spawn(ytDlpPath, ['-f', 'bestaudio', '-o', '-', url], {
        stdio: ['ignore', 'pipe', 'ignore'],
    });
}

export async function getSongFromUrl(url: string): Promise<{ title: string; url: string } | null> {
    return new Promise((resolve, reject) => {
        execFile(ytDlpPath, ['--dump-json', url], (error, stdout, stderr) => {
            if (error) {
                console.error('yt-dlp Fehler:', error);
                return resolve(null);
            }

            try {
                const data = JSON.parse(stdout);
                resolve({ title: data.title, url: data.webpage_url });
            } catch (e) {
                console.error('Fehler beim Parsen der yt-dlp-Ausgabe:', e);
                resolve(null);
            }
        });
    });
}
