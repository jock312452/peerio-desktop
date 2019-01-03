import React from 'react';
import { observer } from 'mobx-react';
import { action } from 'mobx';
import css from 'classnames';

import { contactStore, t } from 'peerio-icebear';
import { List, ListItem, Tooltip } from 'peer-ui';

import routerStore from '~/stores/router-store';
import PlusIcon from '~/ui/shared-components/PlusIcon';

@observer
class Contacts extends React.Component {
    @action
    toAddNew() {
        routerStore.navigateTo(routerStore.ROUTES.newContact);
    }

    @action
    toAdded() {
        contactStore.uiViewFilter = 'added';
        routerStore.navigateTo(routerStore.ROUTES.contacts);
    }
    @action
    toInvited() {
        routerStore.navigateTo(routerStore.ROUTES.invitedContacts);
    }

    @action
    toAll() {
        contactStore.uiViewFilter = 'all';
        routerStore.navigateTo(routerStore.ROUTES.contacts);
    }

    render() {
        const isAddedActive =
            routerStore.currentRoute === routerStore.ROUTES.contacts &&
            contactStore.uiViewFilter === 'added';
        const isAllActive =
            routerStore.currentRoute === routerStore.ROUTES.contacts &&
            contactStore.uiViewFilter === 'all';
        const isInvitedActive = routerStore.currentRoute === routerStore.ROUTES.invitedContacts;
        return (
            <div className="contacts">
                <div className="feature-navigation-list">
                    <div className="list">
                        <List clickable>
                            <div>
                                <PlusIcon onClick={this.toAddNew} label={t('title_contacts')} />
                                <Tooltip text={t('button_addAContact')} position="right" />
                            </div>
                            <ListItem
                                leftIcon="star"
                                caption={`${t('title_favoriteContacts')} (${
                                    contactStore.addedContacts.length
                                })`}
                                className={css({ active: isAddedActive })}
                                onClick={this.toAdded}
                                data-test-id="favoriteContacts"
                            />
                            <ListItem
                                leftIcon="people"
                                caption={`${t('title_allContacts')} (${
                                    contactStore.contacts.length
                                })`}
                                className={css({ active: isAllActive })}
                                onClick={this.toAll}
                                data-test-id="allContacts"
                            />
                            <ListItem
                                leftIcon="person_add"
                                caption={`${t('title_invitedContacts')} (${
                                    contactStore.invitedNotJoinedContacts.length
                                })`}
                                className={css({ active: isInvitedActive })}
                                onClick={this.toInvited}
                                data-test-id="invitedContacts"
                            />
                        </List>
                    </div>
                </div>
                {this.props.children}
            </div>
        );
    }
}

export default Contacts;
