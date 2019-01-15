import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { shell, remote } from 'electron';

import { t } from 'peerio-icebear';
import { Dialog } from 'peer-ui';

import T from '~/ui/shared-components/T';
import updaterStore from '~/stores/updater-store';
import config from '~/config';

@observer
export default class UpdateFailedDialog extends Component {
    handleTryAgain() {
        updaterStore.quitAndRetryInstall();
    }

    handleDownloadManually() {
        shell.openExternal(config.translator.urlMap.download);
        updaterStore.cleanup().then(() => {
            remote.app.quit();
        });
    }

    handleContinue() {
        updaterStore.cleanup();
        updaterStore.lastUpdateFailed = false;
    }

    render() {
        if (!updaterStore.lastUpdateFailed) return null;

        return (
            <Dialog
                className="dialog-update-failed"
                theme="error"
                active={updaterStore.lastUpdateFailed && !updaterStore.installing}
                title={t('title_updateFailed')}
                actions={[
                    {
                        label: t('button_continueUsingOlderVersion'),
                        onClick: this.handleContinue
                    },
                    {
                        label: t('button_downloadManually'),
                        onClick: this.handleDownloadManually
                    },
                    {
                        label: t('button_tryAgain'),
                        onClick: this.handleTryAgain
                    }
                ]}
            >
                <T k="title_updateFailedMessage" />
            </Dialog>
        );
    }
}
