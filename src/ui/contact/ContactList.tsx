import React from 'react';
import { observer } from 'mobx-react';
import { Avatar, Dropdown, SearchInput, Button, List, ListItem } from 'peer-ui';
import { contactStore, chatStore, t } from 'peerio-icebear';
import T from '~/ui/shared-components/T';
import { getAttributeInParentChain } from '~/helpers/dom';
import routerStore from '~/stores/router-store';

@observer
export default class ContactList extends React.Component {
    sortOptions = [
        { value: 'firstName', label: t('title_firstName') },
        { value: 'lastName', label: t('title_lastName') },
        { value: 'username', label: t('title_username') }
    ];

    componentWillMount() {
        if (contactStore.uiView.length) return;
        this.goToAddContact();
    }

    goToAddContact = () => {
        routerStore.navigateTo(routerStore.ROUTES.newContact);
        contactStore.uiViewSearchQuery = '';
    };

    startChat(ev) {
        const username = getAttributeInParentChain(ev.target, 'data-id');
        chatStore.startChat([contactStore.getContact(username)]);
        window.router.push('/app/chats');
    }

    removeContact(ev) {
        const username = getAttributeInParentChain(ev.target, 'data-id');
        contactStore.removeContact(username);
    }

    addContact(ev) {
        const username = getAttributeInParentChain(ev.target, 'data-id');
        contactStore.addContact(username);
    }

    contactActions(c) {
        return (
            <div data-id={c.username}>
                {c.isDeleted ? null : (
                    <Button icon="forum" tooltip={t('title_haveAChat')} onClick={this.startChat} />
                )}
                {c.isAdded ? (
                    <Button
                        className="gold"
                        icon="star"
                        tooltip={t('button_removeFavourite')}
                        onClick={this.removeContact}
                    />
                ) : (
                    <Button
                        icon="star_outline"
                        tooltip={t('button_addFavourite')}
                        onClick={this.addContact}
                    />
                )}
            </div>
        );
    }

    handleSortChange(val) {
        contactStore.uiViewSortBy = val;
    }

    handleSearchQueryChange(val) {
        contactStore.uiViewSearchQuery = val;
    }

    render() {
        const textParser = {
            searchString: contactStore.uiViewSearchQuery,
            toAddContact: text => (
                <a className="clickable" onClick={this.goToAddContact}>
                    {text}
                </a>
            )
        };
        return (
            <div className="contacts-view">
                <div className="toolbar">
                    <SearchInput
                        placeholder={t('title_findAContact')}
                        value={contactStore.uiViewSearchQuery}
                        onChange={this.handleSearchQueryChange}
                        testId="input_contactSearch"
                    />
                </div>

                <div className="list-sort">
                    <Dropdown
                        label={t('title_sort')}
                        options={this.sortOptions}
                        onChange={this.handleSortChange}
                        value={contactStore.uiViewSortBy}
                    />
                </div>

                {contactStore.uiView.length ? (
                    <div className="contact-list">
                        {contactStore.uiView.map(section => (
                            <div key={section.letter} className="contact-list-section">
                                <div className="contact-list-section-marker">{section.letter}</div>
                                <List className="contact-list-section-content" theme="large">
                                    {section.items.map(c => (
                                        <ListItem
                                            key={c.username}
                                            leftContent={
                                                <Avatar key="a" contact={c} size="medium" />
                                            }
                                            legend={c.username}
                                            caption={`${c.firstName} ${c.lastName}`}
                                            rightContent={this.contactActions(c)}
                                            data-test-id={`listItem_${c.username}`}
                                        />
                                    ))}
                                </List>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-contact-found">
                        <T k="error_contactNotFound" className="text">
                            {textParser}
                        </T>
                        <img src="./static/img/illustrations/no-results.svg" draggable={false} />
                    </div>
                )}
            </div>
        );
    }
}
