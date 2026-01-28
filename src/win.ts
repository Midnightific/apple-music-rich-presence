import { SMTCMonitor } from "@coooookies/windows-smtc-monitor";

interface MusicInfo {
    song: string | undefined;
    artist: string | undefined;
    album: string | undefined;
    duration: number;
    position: number;
    isPaused: boolean;
}

interface Session {
    playback?: {
        playbackStatus: number;
    };
    media?: {
        title: string;
        artist: string;
        albumTitle: string;
    };
    timeline?: {
        duration: number;
        position: number;
    };
}

let musicInfoCache: MusicInfo | null = null;
let isInitialized = false;

const smtcMonitor = new SMTCMonitor();

function updateMusicInfo(sourceAppId?: string) {
    const sessions = smtcMonitor.sessions;

    const appleMusicSession = sessions.find((s: any) =>
        s.sourceAppId?.includes('AppleMusic') || s.sourceAppId?.includes('iTunes')
    );

    if (!appleMusicSession) {
        musicInfoCache = null;
        return;
    }

    const isPaused = appleMusicSession.playback?.playbackStatus !== 4;

    const durationRaw = appleMusicSession.timeline?.duration ?? 0;
    const positionRaw = appleMusicSession.timeline?.position ?? 0;

    musicInfoCache = {
        song: appleMusicSession.media?.title,
        artist: appleMusicSession.media?.artist,
        album: appleMusicSession.media?.albumTitle,
        duration: durationRaw / 10000000,
        position: positionRaw / 10000000,
        isPaused
    };

    if (appleMusicSession.playback?.playbackStatus === 0) {
        musicInfoCache = null;
    }

    isInitialized = true;
}

smtcMonitor.on("current-session-changed", () => updateMusicInfo());
smtcMonitor.on("session-playback-changed", () => updateMusicInfo());
smtcMonitor.on("session-media-changed", () => updateMusicInfo());
smtcMonitor.on("session-timeline-changed", () => updateMusicInfo());

smtcMonitor.on("session-added", () => updateMusicInfo());
smtcMonitor.on("session-removed", () => {
    musicInfoCache = null;
    isInitialized = false;
});

export function getMusicInfo(): MusicInfo | null {
    if (!isInitialized) {
        return null;
    }
    return musicInfoCache;
}
