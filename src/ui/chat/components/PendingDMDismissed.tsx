import React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import { chatStore, chatInviteStore } from 'peerio-icebear';
import routerStore from '~/stores/router-store';
import T from '~/ui/shared-components/T';

import { Button } from 'peer-ui';
import EmojiImage from '~/ui/emoji/Image';
import PlusIcon from '~/ui/shared-components/PlusIcon';

@observer
export default class PendingDMDismissed extends React.Component {
    @computed
    get chatListEmpty() {
        // TODO: refactor when SDK is there for chat invites
        return !chatStore.chats.length && !chatInviteStore.received.length;
    }

    onCancel = () => {
        routerStore.navigateTo(routerStore.ROUTES.chats);
    };

    render() {
        return (
            <div className="pending-dm dismissed">
                <EmojiImage emoji="relieved" size="large" />
                <T className="main-text" k="title_acceptedInvitationDismissed">
                    {{ plusIcon: () => <PlusIcon /> }}
                </T>

                {this.chatListEmpty && (
                    <div className="button-container">
                        <Button onClick={this.onCancel}>
                            <T k="button_dismiss" />
                        </Button>
                    </div>
                )}
            </div>
        );
    }
}
