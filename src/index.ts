// We import react-router here for typechecking but don't use it yet; this
// statement should be removed by the compiler. (We could more simply use the
// `typeof import('react-router')` syntax, but
// @babel/plugin-transform-typescript doesn't support it yet; see
// https://github.com/babel/babel/issues/7749.)
import { createMemoryHistory } from 'react-router';

// declaring the augmented Window here makes `router` available elsewhere in the
// codebase. (using `Find References` on `router` below should work!)
//
// note that if the assignment to `window.router` below is ever removed, this
// should obviously be deleted as well.
declare global {
    interface Window {
        // TODO:
        // router: ReturnType<typeof import('react-router').createMemoryHistory>;
        router: ReturnType<typeof createMemoryHistory>;
    }
}

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'production';
}

// Do not change to import! This has to go after fixing process.env above.
const isDevEnv = require('~/helpers/is-dev-env').default;

if (!isDevEnv) require('~/helpers/console-history');
const { ipcRenderer, webFrame } = require('electron');
const { when } = require('mobx');
const languageStore = require('~/stores/language-store').default;

// apply desktop config values to icebear
require('~/config');

if (isDevEnv) {
    // to allow require of development modules in dev environment
    // const path = require('path');
    // const PATH_APP_NODE_MODULES = path.resolve(path.join('node_modules'));
    // require('module').globalPaths.push(PATH_APP_NODE_MODULES);
    // enable react-perf chrome dev tool
    // window.Perf = require('react-addons-perf');
    // enable shortcuts for recording tests
    // window.recordUI = require('~/helpers/test-recorder').recordUI;
    // window.stopRecording = require('~/helpers/test-recorder').stopRecording;
}

// configure logging
require('../build/helpers/logging');

require('./debug-tools');

document.addEventListener('DOMContentLoaded', () => {
    if (navigator.platform.startsWith('Linux')) {
        document.body.classList.add('platform-linux');
    }

    const React = require('react');
    const { socket } = require('peerio-icebear');
    const { render } = require('react-dom');
    const { Router, createMemoryHistory } = require('react-router'); // eslint-disable-line no-shadow
    // if this assignment to `window` is ever removed, make sure the typescript
    // global declaration above is cleaned up as well.
    window.router = createMemoryHistory();
    const routes = require('~/ui/routes').default;

    socket.start();

    // Load translations and render once they're loaded.
    languageStore.loadSavedLanguage();
    when(
        () => languageStore.language,
        () => {
            render(
                React.createElement(Router, { history: window.router, routes }),
                document.getElementById('root')
            );

            ipcRenderer.on('router', (_event, message) => {
                window.router.push(message);
            });

            // starting power management
            require('~/helpers/power').start();
            // starting network management
            require('~/helpers/network').start();
            // starting failed image reload management
            require('~/helpers/image-retry').start();
        }
    );
});

// Disable zoom.
webFrame.setVisualZoomLevelLimits(1, 1);
webFrame.setLayoutZoomLevelLimits(0, 0);
