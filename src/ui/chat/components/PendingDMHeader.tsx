import React from 'react';
import { observer } from 'mobx-react';

import { chatStore } from 'peerio-icebear';
import { Contact, ChatPendingDM } from 'peerio-icebear/dist/models';

import T from '~/ui/shared-components/T';
import AvatarWithPopup from '~/ui/contact/components/AvatarWithPopup';
import EmojiImage from '~/ui/emoji/Image';
import IdentityVerificationNotice from '~/ui/chat/components/IdentityVerificationNotice';

@observer
export default class PendingDMHeader extends React.Component<{
    isNewUser?: boolean;
    contact: Contact;
}> {
    render() {
        const c = this.props.contact;
        const chat = chatStore.activeChat as ChatPendingDM;

        // It should not be possible for `c.addresses[0]` to be null. Nonetheless
        // we'll pass an empty string as backup to avoid screen-of-death.
        const email = chat.email || c.addresses[0] || '';

        return (
            <div className="pending-dm-header">
                <EmojiImage emoji="tada" size="large" />

                {this.props.isNewUser ? (
                    <T k="title_newUserDmInviteHeading" className="main-text">
                        {{ contactName: c.fullName }}
                    </T>
                ) : (
                    <div className="main-text">
                        <T k="title_goodNews" />
                        <br />
                        <T k="title_dmInviteHeading">{{ contactName: c.fullName }}</T>
                    </div>
                )}

                {this.props.isNewUser ? null : (
                    <T
                        k={
                            chat.isAutoImport
                                ? 'title_userInAddressBook'
                                : 'title_invitedUserViaEmail'
                        }
                        className="invite-type"
                    >
                        {{ firstName: c.firstName, email }}
                    </T>
                )}

                <div className="user-profile-container">
                    <AvatarWithPopup contact={c} size="large" />
                    <div className="username">@{c.username}</div>
                </div>

                <IdentityVerificationNotice />
            </div>
        );
    }
}
