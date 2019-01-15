import React, { Component } from 'react';
import { observer } from 'mobx-react';

import { t } from 'peerio-icebear';
import { Dialog, ProgressBar } from 'peer-ui';

import T from '~/ui/shared-components/T';
import updaterStore from '~/stores/updater-store';

@observer
export default class InstallingUpdateDialog extends Component {
    render() {
        return (
            <Dialog
                className="dialog-installing-update"
                active={updaterStore.installing}
                title={t('title_installingUpdate')}
            >
                <ProgressBar className="installing-update-progress" circular />
                <div className="installing-update-message">
                    <T k="title_installingUpdatePleaseWait" />
                    <br />
                    <T k="title_installingUpdateWillRestart" />
                </div>
            </Dialog>
        );
    }
}
