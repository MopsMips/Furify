import { spawn, ChildProcess } from 'child_process';

// Absoluter Pfad zur yt-dlp.exe (bitte anpassen, falls sich der Pfad ändert)
export const ytDlpPath = 'C:/Users/Eileen/AppData/Local/Programs/Python/Python313/Scripts/yt-dlp.exe';

/**
 * Startet yt-dlp und gibt den ChildProcess zurück.
 * @param url Die YouTube-URL
 */
export function getYtDlpStream(url: string): ChildProcess {
    return spawn(ytDlpPath, ['-f', 'bestaudio', '-o', '-', url], {
        stdio: ['ignore', 'pipe', 'ignore'],
    });
}
