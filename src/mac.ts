import { runAppleScript } from 'run-applescript';

export async function getMacMusicTrackInfo() {
    const script = `tell application "Music"
        if it is running then
            if player state is playing then
                return (name of current track) & "|" & (artist of current track) & "|" & (album of current track) & "|" & (duration of current track) & "|" & (player position) & "|playing"
            else if player state is paused then
                return (name of current track) & "|" & (artist of current track) & "|" & (album of current track) & "|" & (duration of current track) & "|" & (player position) & "|paused"
            else
                return "stopped"
            end if
        else
            return "stopped"
        end if
    end tell`;

    try {
        const result = await runAppleScript(script);
        if (!result || result === 'stopped') {
            return null;
        }

        const parts = result.split('|');

        if (parts.length < 6) return null;

        const song = parts[0];
        const artist = parts[1];
        const album = parts[2];
        const duration = parseFloat(parts[3]);
        const position = parseFloat(parts[4]);
        const state = parts[5];

        return {
            song,
            artist,
            album,
            duration,
            position,
            isPaused: state === 'paused'
        };
    } catch (error) {
        return null;
    }
}
