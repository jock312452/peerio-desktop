import React from 'react';
import { observer } from 'mobx-react';
import { action, observable } from 'mobx';

import { Avatar } from 'peer-ui';
import ContactProfile from './ContactProfile';

interface AvatarWithPopupProps {
    contact: any;
    size?: 'tiny' | 'small' | 'medium' | 'large' | 'full';
    tooltip?: boolean;
}

@observer
export default class AvatarWithPopup extends React.Component<AvatarWithPopupProps> {
    @observable contactProfileActive = false;

    @action.bound
    closeContactProfile() {
        this.contactProfileActive = false;
    }

    @action.bound
    openContactProfile(ev: React.MouseEvent) {
        ev.stopPropagation();
        this.contactProfileActive = true;
    }

    render() {
        const popup = (
            <ContactProfile
                key={`avatarwithpopup-dialog-${this.props.contact.username}`}
                active={this.contactProfileActive}
                onCancel={this.closeContactProfile}
                contact={this.props.contact}
            />
        );

        const avatar = (
            <Avatar
                key={`avatarwithpopup-avatar-${this.props.contact.username}`}
                contact={this.props.contact}
                size={this.props.size}
                tooltip={this.props.tooltip}
                onClick={this.openContactProfile}
            />
        );

        return [avatar, popup];
    }
}
