import React from 'react';
import { observable, action, computed } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { contactStore, User, warnings, t } from 'peerio-icebear';
import { Button, SearchInput, ProgressBar } from 'peer-ui';

import T from '~/ui/shared-components/T';
import BackgroundIllustration from '~/ui/shared-components/BackgroundIllustration';
import UserSearchError from '~/whitelabel/components/UserSearchError';
import config from '~/config';
import uiStore from '~/stores/ui-store';
import routerStore from '~/stores/router-store';
import beaconStore from '~/stores/beacon-store';
import Beacon from '~/ui/shared-components/Beacon';

const urls = config.translator.urlMap;

@observer
export default class NewContact extends React.Component {
    /** Search query for contacts */
    @observable query = '';

    /** Flag to display certain bits of UI when search query results in user not found */
    @observable notFound = false;

    /**
     * If user searches by email and no match is found, we display a piece of UI
     * suggesting that the user sends an invite to that email.
     */
    @observable suggestInviteEmail = '';

    /** Flag set to `true` while search is in progress; displays ProgressBar. */
    @observable waiting = false;

    /**
     * Same component is used for "add" and "invite" contact.
     * When on invited zero state view, we want to render it slightly differently.
     */
    @observable isInviteView = false;

    @computed
    get showSearchError() {
        return this.notFound || !!this.suggestInviteEmail;
    }

    componentWillMount() {
        this.isInviteView = routerStore.currentRoute === routerStore.ROUTES.newInvite;

        if (!contactStore.contacts.length) {
            beaconStore.addBeacons('search');
        }

        if (uiStore.firstLogin) {
            beaconStore.addBeacons('files');
            beaconStore.queueIncrement(8000, 'search');
        }
    }

    componentWillUpdate() {
        this.isInviteView = routerStore.currentRoute === routerStore.ROUTES.newInvite;
    }

    componentWillUnmount() {
        beaconStore.clearBeacons();
        beaconStore.clearIncrementQueue();
    }

    // Don't use onKeyUp - text change fires earlier
    handleKeyDown = async e => {
        if (e.key === 'Enter' && this.query !== '') {
            if (this.isInviteView) this.invite();
            else this.tryAdd();
        }
    };

    @action.bound
    handleTextChange(newVal: string) {
        this.notFound = false;
        this.query = newVal.toLocaleLowerCase().trim();

        // Beacon management
        if (beaconStore.activeBeacon === 'search') {
            beaconStore.clearBeacons();
        }

        if (uiStore.firstLogin && !beaconStore.beaconsInQueue.length) {
            beaconStore.queueBeacons('files', 8000);
        }
    }

    tryAdd = async () => {
        if (this.waiting) return;
        this.waiting = true;
        this.suggestInviteEmail = '';
        this.notFound = false;

        const c = await contactStore.whitelabel.getContact(this.query, 'addcontact');

        if (c.notFound || c.isHidden) {
            this.notFound = true;
            const atInd = this.query.indexOf('@');
            const isEmail = atInd > -1 && atInd === this.query.lastIndexOf('@');
            if (isEmail) {
                this.suggestInviteEmail = this.query;
                this.query = '';
            }
        } else {
            this.query = '';
            contactStore.getContactAndSave(c.username);
            warnings.add(t('title_contactAdded', { name: c.fullNameAndUsername }));
        }
        this.waiting = false;
    };

    invite = () => {
        contactStore.invite(this.isInviteView ? this.query : this.suggestInviteEmail);
        this.suggestInviteEmail = '';
        this.notFound = false;
        if (this.isInviteView) this.query = '';
    };

    getFacebookUrl() {
        const link = encodeURIComponent(urls.socialShareUrl);
        const image = encodeURIComponent(urls.socialShareImage);
        const title = encodeURIComponent(t('title_socialShareInvite'));
        const content = encodeURIComponent(
            t('title_socialShareInviteContent', {
                socialShareUrl: urls.socialShareUrl,
                username: User.current.username
            })
        );
        const url =
            `https://www.facebook.com/dialog/feed?app_id=184683071273&link=${link}&picture=${image}` +
            `&name=${title}&caption=%20&description=${content}&redirect_uri=https%3A%2F%2Fwww.facebook.com`;
        return url;
    }

    getEmailUrl() {
        const title = encodeURIComponent(t('title_socialShareInvite'));
        const content = encodeURIComponent(
            t('title_socialShareInviteContent', {
                socialShareUrl: urls.socialShareUrl,
                username: User.current.username
            })
        );
        const url = `mailto:?subject=${title}&body=${content}`;
        return url;
    }

    getTwitterUrl() {
        const message = encodeURIComponent(
            t('title_socialShareInviteContent', {
                socialShareUrl: urls.socialShareUrl,
                username: User.current.username
            })
        );
        return `https://twitter.com/intent/tweet?text=${message}`;
    }

    render() {
        const hideButton =
            !this.query.length ||
            this.waiting ||
            (this.isInviteView && this.query.indexOf('@') < 0);

        return (
            <div className="contacts new-contact">
                <div className="contacts-view create-new-chat user-picker">
                    <div className="invite-form">
                        <T k="title_teamUp" className="title" tag="div" />

                        <div className="message-search-wrapper">
                            <Beacon
                                name="search"
                                title={t('title_search_beacon')}
                                description={t('description_search_beacon')}
                                type="area"
                                arrowPosition="top"
                                arrowDistance={75}
                                offsetX={168}
                                offsetY={12}
                            >
                                <div className="new-contact-search">
                                    <SearchInput
                                        placeholder={t(
                                            this.isInviteView
                                                ? 'title_enterEmail'
                                                : 'title_userSearch'
                                        )}
                                        value={this.query}
                                        onChange={this.handleTextChange}
                                        onKeyDown={this.handleKeyDown}
                                        autoFocus
                                        noHelperText
                                    />

                                    <Button
                                        className={css({ hide: hideButton })}
                                        label={t(
                                            this.isInviteView ? 'button_invite' : 'button_add'
                                        )}
                                        onClick={this.isInviteView ? this.invite : this.tryAdd}
                                        theme="affirmative"
                                    />
                                    {this.waiting && <ProgressBar circular size="small" />}
                                </div>
                            </Beacon>
                            {this.showSearchError ? (
                                <UserSearchError
                                    userNotFound={this.notFound ? this.query : null}
                                    suggestInviteEmail={this.suggestInviteEmail}
                                    onInvite={this.invite}
                                    isChannel={routerStore.isNewChannel}
                                />
                            ) : null}
                        </div>
                        <div className="invite-elsewhere">
                            <T k="title_shareSocial" tag="strong" />
                            <div className="icons">
                                <Button icon="email" href={this.getEmailUrl()} theme="no-hover" />
                                <a
                                    className="twitter-share-button"
                                    href={this.getTwitterUrl()}
                                    data-size="large"
                                >
                                    <img src="./static/img/twitter.png" alt="twitter" />
                                </a>
                                <a
                                    className="facebook-share-button"
                                    href={this.getFacebookUrl()}
                                    data-size="large"
                                >
                                    <img src="./static/img/facebook.png" alt="twitter" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <BackgroundIllustration
                    src="./static/img/illustrations/contacts-add-invite.svg"
                    height={464}
                    width={496}
                    distance={24}
                />
            </div>
        );
    }
}
