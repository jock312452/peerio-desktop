import React from 'react';
import { observer } from 'mobx-react';
import { Button, List, ListItem } from 'peer-ui';
import { contactStore, t } from 'peerio-icebear';
import { InvitedContact } from 'peerio-icebear/dist/defs/interfaces';
import moment from 'moment';
import { getAttributeInParentChain } from '~/helpers/dom';
import routerStore from '~/stores/router-store';

@observer
export default class InvitedContacts extends React.Component {
    componentWillMount() {
        this.rerouteIfZero();
    }

    componentWillUpdate() {
        this.rerouteIfZero();
    }

    rerouteIfZero = () => {
        if (contactStore.invitedNotJoinedContacts.length) return;
        routerStore.navigateTo(routerStore.ROUTES.newInvite);
    };

    removeInvite(ev: React.MouseEvent<HTMLButtonElement>) {
        const email = getAttributeInParentChain(ev.target as HTMLElement, 'data-id');
        contactStore.removeInvite(email);
    }
    resendInvite(ev: React.MouseEvent<HTMLButtonElement>) {
        const email = getAttributeInParentChain(ev.target as HTMLElement, 'data-id');
        contactStore.invite(email);
    }
    contactActions(c: InvitedContact) {
        return (
            <div data-id={c.email}>
                <Button
                    icon="email"
                    tooltip={t('button_resendInvite')}
                    tooltipPosition="bottom"
                    onClick={this.resendInvite}
                />
                <Button
                    icon="delete"
                    tooltip={t('button_delete')}
                    tooltipPosition="bottom"
                    onClick={this.removeInvite}
                />
            </div>
        );
    }

    render() {
        return (
            <div className="invited-contacts contacts-view">
                <div className="toolbar" />

                <div className="list-sort" />

                <div className="contact-list">
                    <div className="contact-list-section">
                        <div className="contact-list-section-marker" />
                        <List className="contact-list-section-content" theme="large">
                            {contactStore.invitedNotJoinedContacts.map(c => (
                                <ListItem
                                    key={c.email}
                                    leftContent={
                                        <div className="avatar-invited material-icons">person</div>
                                    }
                                    caption={c.email}
                                    legend={`${t('title_invited')} ${moment(c.added).fromNow()}`}
                                    rightContent={this.contactActions(c)}
                                />
                            ))}
                        </List>
                    </div>
                </div>
            </div>
        );
    }
}
