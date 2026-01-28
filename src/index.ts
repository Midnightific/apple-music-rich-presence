import * as rpc from 'discord-rpc';
import * as os from 'os';

const CLIENT_ID ='1465925855757864970';
const UPDATE_INTERVAL = 5000;

const client = new rpc.Client({ transport: 'ipc' });
let platform = os.platform();

interface MusicInfo {
    song: string | undefined;
    artist: string | undefined;
    album: string | undefined;
    duration: number | string;
    position: number | string;
    isPaused: boolean;
}

async function getPlatformData(): Promise<MusicInfo | null> {
    try {
        if (platform === 'win32') {
            const win = await import('./win.js');
            return win.getMusicInfo();
        }
        else if (platform === 'darwin') {
            const mac = await import('./mac.js');
            return await mac.getMacMusicTrackInfo();
        }
    } catch (e) {
        console.error("Error fetching data:", e);
        return null;
    }
    return null;
}

async function updateActivity() {
    const data = await getPlatformData();

    if (!data || !data.song) {
        await client.clearActivity();
        return;
    }

    const durationSeconds = Number(data.duration);
    const positionSeconds = Number(data.position);

    const progressPercent = durationSeconds > 0
        ? Math.round((positionSeconds / durationSeconds) * 100)
        : 0;

    const activity: any = {
        details: data.song,
        state: `by ${data.artist}`,
        largeImageKey: 'applemusic_logo',
        largeImageText: data.album || 'Apple Music',
        instance: false,
    };

    if (data.isPaused) {
        activity.smallImageKey = 'pause_icon';
        activity.smallImageText = `Paused • ${progressPercent}%`;
    } else {
        activity.smallImageKey = 'play_icon';
        activity.smallImageText = `${progressPercent}%`;
    }

    try {
        await client.setActivity(activity);
    } catch (e) {
        console.error("Error setting activity:", e);
    }
}

client.on('ready', () => {
    console.log(`Authed for user: ${client.user?.username}`);

    updateActivity();
    setInterval(updateActivity, UPDATE_INTERVAL);
});

client.login({ clientId: CLIENT_ID }).catch(console.error);
