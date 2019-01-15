import React, { Component } from 'react';
import { observer } from 'mobx-react';

import { t } from 'peerio-icebear';
import { Dialog } from 'peer-ui';

import T from '~/ui/shared-components/T';
import updaterStore from '~/stores/updater-store';

@observer
export default class ReadyToInstallUpdateDialog extends Component {
    handleUpdate() {
        updaterStore.quitAndInstall();
    }
    handleLater() {
        updaterStore.askToInstall = false;
    }
    render() {
        const actions = [{ label: t('button_installUpdate'), onClick: this.handleUpdate }];
        if (!updaterStore.mandatory) {
            actions.unshift({
                label: t('button_installUpdateLater'),
                onClick: this.handleLater
            });
        }
        return (
            <Dialog
                className="dialog-ready-to-install"
                active={
                    updaterStore.readyToInstall &&
                    updaterStore.askToInstall &&
                    !updaterStore.installing
                }
                actions={actions}
            >
                <T k="title_updateWillRestart" />
            </Dialog>
        );
    }
}
