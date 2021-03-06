import React from 'react';
import { Dialog } from 'peer-ui';
import { observer } from 'mobx-react';
import { warnings, t } from 'peerio-icebear';

import T from '~/ui/shared-components/T';

import WarningDisplayBase from './WarningDisplayBase';

@observer
export default class SystemWarningDialog extends WarningDisplayBase {
    constructor(props) {
        super('severe', props);
    }

    render() {
        const w = warnings.current;

        return (
            <Dialog
                theme="warning"
                active={this.isVisible}
                title={w && w.title ? (t(w.title as any) as string) : ''}
                actions={[{ label: t('button_ok'), onClick: this.dismiss }]}
            >
                {w ? <T k={w.content as any}>{w.data}</T> : null}
            </Dialog>
        );
    }
}
