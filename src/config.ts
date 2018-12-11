import os from 'os';
import path from 'path';

import { setUrlMap, setTagHandler, setStringReplacement } from 'peerio-translator';
import { config, Config } from 'peerio-icebear';
import FileStream from 'peerio-icebear/dist/models/files/node-file-stream';
import StorageEngine from 'peerio-icebear/dist/models/storage/node-json-storage';

import isDevEnv from '~/helpers/is-dev-env';
import CacheEngine from '~/stores/indexed-db-storage';
import tagHandlers from '~/ui/shared-components/translator-tag-handlers';

const app = require('electron').app || require('electron').remote.app;
const packageJson = require(path.join(app.getAppPath(), 'package.json'));

if (!packageJson) {
    throw new Error(`Unable to find package.json (resources path: ${process.resourcesPath})`);
}
if (!packageJson.peerio) {
    throw new Error('Missing "peerio" in package.json');
}

interface DesktopConfig extends Config {
    os: string;
    translator: {
        stringReplacements: { original: string; replacement: string }[];
        urlMap: { [key: string]: string };
    };
    FileStream: typeof FileStream;
    StorageEngine: typeof StorageEngine;
    CacheEngine: typeof CacheEngine;
    nodeLogFolder: string;
    devAutologin?: Partial<{
        username: string;
        passphrase: number;
        signupPassphraseOverride: string;
        autologin: boolean;
        navigateTo: string;
        debug: Config['debug'];
    }>;
    // From package.json:
    keychainService: string;
    appId: string;
    socketServerUrl: string;
    disablePayments: boolean;
    whiteLabel: {
        name: string;
    };
    contacts: {
        supportUser: string;
        supportEmail: string;
        feedbackUser: string;
    };
    beacons: {
        dmCountPinPrompt: string;
        fileCountFolderPrompt: string;
        messageCountSharePrompt: string;
    };
}

const cfg = config as DesktopConfig;

Object.assign(cfg, packageJson.peerio);

cfg.appVersion = app.getVersion();
cfg.platform = 'electron';
cfg.arch = os.arch();
cfg.os = os.type();

setUrlMap(cfg.translator.urlMap);
for (const [tag, handler] of Object.entries(tagHandlers)) {
    setTagHandler(tag, handler);
}

// replace config-specific strings
cfg.translator.stringReplacements.forEach(replacementObject => {
    setStringReplacement(replacementObject.original, replacementObject.replacement);
});

// --- PLATFORM SPECIFIC IMPLEMENTATIONS
cfg.FileStream = FileStream;
cfg.FileStream.storageFolder = path.join(app.getPath('userData'), 'ImageCache');
cfg.StorageEngine = StorageEngine;
cfg.StorageEngine.storageFolder = app.getPath('userData');
cfg.CacheEngine = CacheEngine;

// --- FILE UPLOAD/DOWNLOAD SETTINGS
cfg.download.parallelism = 4;
cfg.download.maxDownloadChunkSize = 1024 * 1024 * 10;
cfg.download.maxDecryptBufferSize = 1024 * 1024 * 10;
cfg.upload.encryptBufferSize = 1024 * 1024 * 3;
cfg.upload.uploadBufferSize = 1024 * 1024 * 3;

// --- PERFORMANCE
cfg.chat.maxInitialChats = 20;

// --- IMAGE DISPLAY LIMITS
cfg.chat.inlineImageSizeLimit = 10 * 1024 * 1024;
cfg.chat.inlineImageSizeLimitCutoff = 30 * 1024 * 1024;

cfg.assetPathResolver = fileName => {
    return path.join(app.getAppPath(), `/node_modules/peerio-icebear/src/assets/${fileName}`);
};
// --- DEBUG
cfg.nodeLogFolder = path.join(app.getPath('userData'), 'logs');

// --- DEV ENV SETTINGS
if (isDevEnv) {
    try {
        cfg.devAutologin = require('../autologin.json');
        cfg.debug = cfg.devAutologin.debug || cfg.debug;
    } catch (err) {
        // don't care
    }
}

// FOR DEV ENVIRONMENT ONLY
if (isDevEnv) {
    // DEV MACHINE OVERRIDES SOCKET SERVER VALUE WITH THIS
    if (process.env.PEERIO_STAGING_SOCKET_SERVER) {
        cfg.socketServerUrl = process.env.PEERIO_STAGING_SOCKET_SERVER;
    }
    // Allow overriding of whitelabel config.
    if (process.env.PEERIO_WHITELABEL) {
        cfg.whiteLabel.name = process.env.PEERIO_WHITELABEL;
    }
}

// --- DIAGNOSTIC STARTUP LOG
try {
    console.log(isDevEnv ? 'DEV environment detected' : 'PROD environment detected');
    console.log(
        `Starting app: ${cfg.appId} v${cfg.appVersion} | ${cfg.arch} | ${cfg.platform} | ` +
            `${os.platform()}-${os.release()} | ${os.cpus().length} CPUs | ` +
            `${os.totalmem() / 1024 / 1024 / 1024}GB RAM (${+(
                os.freemem() /
                1024 /
                1024 /
                1024
            ).toFixed(2)}GB free) | ` +
            `${Math.round(os.uptime() / 60 / 60)} hours uptime`
    );
} catch (err) {
    console.log(err);
}

export default cfg;
