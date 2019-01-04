if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'production';
}

const { app, BrowserWindow, globalShortcut } = require('electron');
const { isAppInDMG, handleLaunchFromDMG } = require('~/main-process/dmg');

let mainWindow;

process.on('uncaughtException', error => {
    console.error('uncaughtException in Node:', error);
});

const isDevEnv = require('~/helpers/is-dev-env').default;
const isTestEnv = require('~/helpers/is-test-env').default;

if (isDevEnv) {
    // enable source map support in the electron main process. (the render
    // process should pick up source maps on its own just fine.)
    require('source-map-support').install();
}

let singleInstanceLock;

if (!isDevEnv && !process.argv.includes('--allow-multiple-instances')) {
    // In production version, don't allow running more than one instance.
    // This code must be executed as early as possible to prevent the second
    // instance from initializing before it decides to quit.
    singleInstanceLock = app.requestSingleInstanceLock();

    if (!singleInstanceLock) {
        console.log('Another instance is already running, quitting.');
        if (isAppInDMG(process.execPath)) {
            // We are the second instance running from disk image on macOS.
            // The first instance will quit, we continue trying to acquire lock.
            // This is nasty, but we need to block here, and we can't sleep directly in Node,
            // so we sleep by executing 'sleep'.
            const { execSync } = require('child_process');
            for (let i = 0; i < 10; i++) {
                singleInstanceLock = app.requestSingleInstanceLock();
                if (singleInstanceLock) break;
                try {
                    execSync('sleep 1');
                } catch (err) {
                    // ignore
                }
            }
            if (!singleInstanceLock) {
                // Failed to acquire lock. Maybe the app is an older version
                // that doesn't exit when launching the second instance from DMG,
                // or just something else happened. Let's quit.
                process.exit();
            }
            // From now on we're running instead of the first instance.
        } else {
            process.exit();
        }
    }
}

const path = require('path');

// On Windows, change user data path from Electron's default
// %APPDATA% to %LOCALAPPDATA%, since we don't want any of our
// local data to be in the Roaming directory, which is synched
// between machines in some corporate environments.
//
// IMPORTANT: this must be done _before_ requiring config.js.
if (
    process.platform === 'win32' &&
    process.env.LOCALAPPDATA // in case we don't have %LOCALAPPDATA% for some reason
) {
    const oldUserData = app.getPath('userData');
    const newUserData = path.join(process.env.LOCALAPPDATA, app.getName());

    if (oldUserData !== newUserData) {
        try {
            // Since we used to store data in %APPDATA%, we need to move
            // all our old data to into a new directory if the new userData
            // directory doesn't exist.
            //
            // This needs to happen before Electron's app 'ready' event.
            // Also, everything needs to be synchronous.
            //
            // XXX: moving can be removed in the future when older versions
            // of the client are deprecated and everyone's updated.
            const fse = require('fs-extra');
            if (!fse.existsSync(newUserData) && fse.existsSync(oldUserData)) {
                fse.moveSync(oldUserData, newUserData);
                console.log(`Moved ${oldUserData} to ${newUserData}`);
            }

            // Set new paths.
            app.setPath('appData', process.env.LOCALAPPDATA);
            app.setPath('userData', newUserData);
        } catch (e) {
            // Failed to move old folder, so continue using it.
            console.error(e);
        }
    }
}

// For dev builds we want to use separate user data directory
if (isDevEnv) {
    app.setPath(
        'userData',
        path.resolve(
            app.getPath('appData'),
            `${app.getName().toLowerCase()}_${isTestEnv ? '_test' : '_dev'}`
        )
    );
}

// configure logging
require('~/helpers/logging');

const { onAppReady: devtoolsOnAppReady, installExtensions } = require('~/main-process/dev-tools');
const buildContextMenu = require('~/main-process/context-menu').default;
const buildGlobalShortcuts = require('~/main-process/global-shortcuts').default;
const applyMiscHooks = require('~/main-process/misc-hooks').default;
const { saveWindowState, getSavedWindowState } = require('~/main-process/state-persistance');
const setMainMenu = require('~/main-process/main-menu').default;
const setTrayIcon = require('~/main-process/tray').default;
const updater = require('./main-process/updater');
const config = require('~/config').default;

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disk-cache-size', 200 * 1024 * 1024);
app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');

if (process.env.REMOTE_DEBUG_PORT !== undefined) {
    app.commandLine.appendSwitch('remote-debugging-port', process.env.REMOTE_DEBUG_PORT);
}

let mustCloseWindow = false;

app.once('before-quit', () => {
    mustCloseWindow = true;
});

app.on('ready', async () => {
    console.log('Electron ready event - Starting app.');
    buildGlobalShortcuts();
    setMainMenu();
    if (process.platform === 'win32') {
        setTrayIcon();
    }
    app.setAppUserModelId(config.appId);

    if (isAppInDMG(process.execPath)) {
        await handleLaunchFromDMG();
    }

    await config.FileStream.createTempCache();

    const windowState = await getSavedWindowState();
    const winConfig = Object.assign(
        {
            show: false,
            center: true,
            minWidth: 900,
            minHeight: 728,
            title: app.getName()
        },
        windowState
    );

    if (isDevEnv) {
        winConfig.title = `${winConfig.title} DEV`;
        winConfig.icon = `${__dirname}/static/img/icon-dev.png`;
    } else if (process.platform === 'linux') {
        winConfig.icon = `${__dirname}/static/img/icon.png`;
    }

    await installExtensions();

    mainWindow = new BrowserWindow(winConfig);
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    const rememberWindowState = () => {
        if (mainWindow.isMaximized()) {
            windowState.isMaximized = true;
            return;
        }
        windowState.isMaximized = false;
        if (mainWindow.isMinimized() || mainWindow.isFullScreen()) {
            // don't remember minimized or fullscreen state.
            return;
        }
        Object.assign(windowState, mainWindow.getBounds());
    };

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        if (windowState.isMaximized) {
            mainWindow.maximize();
        }
    });

    mainWindow.on('resize', () => {
        rememberWindowState();
    });

    mainWindow.on('maximize', () => {
        rememberWindowState();
    });

    mainWindow.on('unmaximize', () => {
        rememberWindowState();
    });

    mainWindow.on('restore', () => {
        rememberWindowState();
    });

    mainWindow.on('minimize', () => {
        rememberWindowState();
    });

    const handleClose = async function(e) {
        e.preventDefault();
        try {
            await saveWindowState(windowState);
        } catch (err) {
            console.error(err);
        }
        if (!mustCloseWindow && (process.platform === 'darwin' || process.platform === 'win32')) {
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
                // Electron doesn't want to hide window until full screen
                // animation is complete and provides no way to know when
                // it completes, so we do our best guess of hiding after
                // 1 second. Worst case if it doesn't work: the user will
                // have to press close again.
                setTimeout(() => {
                    mainWindow.hide();
                }, 1000);
            } else {
                mainWindow.hide();
            }
            mainWindow.webContents.send('main-window-hidden');
        } else {
            mainWindow.removeListener('close', handleClose);
            mainWindow.close();
        }
    };

    mainWindow.on('close', handleClose);

    mainWindow.once('closed', () => {
        mainWindow = null;
    });

    applyMiscHooks(mainWindow);
    buildContextMenu(mainWindow);
    devtoolsOnAppReady(mainWindow);

    if (!isAppInDMG(process.execPath)) {
        updater.start(mainWindow);
    }
});

app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
    }
});

if (singleInstanceLock) {
    app.on('second-instance', (event, commandLine) => {
        if (process.platform === 'darwin' && commandLine && commandLine.length > 0) {
            const secondInstanceExecPath = commandLine[0];
            if (process.execPath !== secondInstanceExecPath && isAppInDMG(secondInstanceExecPath)) {
                // Launched another instance from DMG, while the current instance is not from DMG.
                // We assume the second instance was manually downloaded and thus is a newer version,
                // so we quit the current app, letting the second instance take over.
                app.quit();
                return;
            }
        }
        // Restore window if user tried to launch second instance.
        if (mainWindow) {
            mainWindow.show();
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });
}

app.once('will-quit', async e => {
    e.preventDefault();
    try {
        await config.FileStream.deleteTempCache();
        console.log('Cache deleted');
    } catch (err) {
        console.error(err);
    }
    app.quit();
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    app.quit();
});
