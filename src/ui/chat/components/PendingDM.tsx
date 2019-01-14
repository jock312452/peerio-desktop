import React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import routerStore from '~/stores/router-store';
import { chatStore } from 'peerio-icebear';
import T from '~/ui/shared-components/T';

import { Button } from 'peer-ui';
import PendingDMHeader from './PendingDMHeader';
import { ChatPendingDM } from 'peerio-icebear/dist/models';

@observer
export default class PendingDM extends React.Component {
    @computed
    get activeChat() {
        return chatStore.activeChat as ChatPendingDM;
    }

    onDismiss() {
        routerStore.navigateTo(routerStore.ROUTES.pendingDMDismissed);
        this.activeChat.dismiss();
    }

    onMessage = () => {
        this.activeChat.start();
    };

    render() {
        if (!this.activeChat) return null;
        const c = this.activeChat.contact || this.activeChat.otherParticipants[0];
        if (!c) return null;

        return (
            <div className="pending-dm">
                <PendingDMHeader isNewUser={this.activeChat.isReceived} contact={c} />

                <div className="button-container">
                    <Button onClick={this.onDismiss}>
                        <T k="button_dismiss" />
                    </Button>
                    <Button onClick={this.onMessage} theme="affirmative">
                        <T k="button_message" />
                    </Button>
                </div>
            </div>
        );
    }
}
