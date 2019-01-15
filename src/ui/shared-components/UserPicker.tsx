import React from 'react';
import {
    observable,
    computed,
    when,
    transaction,
    reaction,
    IObservableArray,
    IReactionDisposer,
    Lambda
} from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { fileStore, contactStore, User, t, LocalizationStrings } from 'peerio-icebear';
import { Contact } from 'peerio-icebear/dist/models';
import {
    Avatar,
    Button,
    Chip,
    List,
    ListHeading,
    ListItem,
    ProgressBar,
    SearchInput
} from 'peer-ui';

import T from '~/ui/shared-components/T';
import routerStore from '~/stores/router-store';
import UserSearchError from '~/whitelabel/components/UserSearchError';

interface UserPickerProps {
    title: string;
    description?: string | JSX.Element | JSX.Element[];
    limit?: number;
    /**
     * If this is a room creation user picker, which is based on some global
     * state like the current route, then onAccept will (possibly?) not receive
     * any contacts. Otherwise, it will receive the picked contacts. I don't
     * really get how this works, and it may in fact be an error. See `FIXME` in
     * the render method below.
     */
    onAccept: (contacts: Contact[]) => void;
    onClose?: () => void;
    onChange?: (contacts: Contact[]) => void;
    isDM?: boolean;
    context?: 'newchat' | 'newpatientspace' | 'patientroom';
    sharing?: boolean;
    onlyPick?: boolean;
    closeable?: boolean;
    noInvite?: boolean;
    exceptContacts?: Contact[];
    noDeleted?: boolean;
    /** The label for the confirm button of this component. */
    button?: React.ReactChild;
    noSubmit?: boolean;
    noAutoFocus?: boolean;
    noHeader?: boolean;
    className?: string;
}

@observer
export default class UserPicker extends React.Component<UserPickerProps> {
    @observable selected = [] as IObservableArray<Contact>;
    @observable query = '';
    accepted = false;
    @observable suggestInviteEmail = '';
    @observable showNotFoundError = false;
    @observable userAlreadyAdded = '';
    @observable foundContact: Contact | null = null;
    @observable contactLoading = false;

    // FIXME: this was never declared as a field and so was never observable.
    // i'm not sure what effect making it observable would have now, so i've
    // left it as-is.
    userNotFound?: string;

    @observable _searchUsernameTimeout: NodeJS.Timeout | null = null;

    disposer: IReactionDisposer;
    onChangeDisposer?: Lambda;

    @computed
    get showSearchError() {
        return this.suggestInviteEmail || this.showNotFoundError || this.userAlreadyAdded;
    }

    @computed
    get isRoomCreation() {
        return (
            routerStore.isNewChannel ||
            routerStore.isNewPatient ||
            routerStore.isNewPatientRoom ||
            routerStore.isNewInternalRoom
        );
    }

    componentDidMount() {
        if (this.props.onChange) {
            this.onChangeDisposer = this.selected.observe(() => this.props.onChange(this.selected));
        }

        // Reset search and selection when changing between two views that both use UserPicker
        this.disposer = reaction(
            () => routerStore.currentRoute,
            () => {
                this.reset();
                this.selected = [] as IObservableArray<Contact>;
            }
        );
    }

    componentDidUpdate(nextProps: UserPickerProps) {
        if (nextProps.onChange !== this.props.onChange) {
            if (this.onChangeDisposer) this.onChangeDisposer();
            if (nextProps.onChange) {
                this.onChangeDisposer = this.selected.observe(() =>
                    nextProps.onChange(this.selected)
                );
            }
        }
    }

    componentWillUnmount() {
        this.disposer();
        if (this.onChangeDisposer) this.onChangeDisposer();
    }

    @computed
    get options() {
        const ret = contactStore.whitelabel
            .filter(this.query, this.props.context)
            .filter(this.filterOptions);
        const favorites = ret.filter(s => s.isAdded);
        const normal = ret.filter(s => !s.isAdded);
        return {
            favorites,
            normal
        };
    }

    @computed
    get isValid() {
        return !this.selected.find(s => s.loading || s.notFound || s.isHidden);
    }

    @computed
    get selectedSelfless() {
        return this.selected.filter(this.selfFilter);
    }

    @computed
    get queryIsEmpty() {
        return !this.query.trim().length;
    }

    filterOptions = (item: Contact) => {
        if (this.selected.find(s => s.username === item.username)) return false;
        if (this.props.noDeleted && item.isDeleted) return false;
        if (item.isMe) return false;
        if (this.isExcluded(item)) return false;

        return true;
    };

    isExcluded(contact: Contact) {
        if (this.props.exceptContacts && this.props.exceptContacts.includes(contact)) return true;
        return false;
    }

    selfFilter(contact: Contact) {
        return contact.username !== User.current.username;
    }

    reset() {
        this.showNotFoundError = false;
        this.userAlreadyAdded = '';
        this.suggestInviteEmail = '';
        this.foundContact = null;
    }

    handleTextChange = (newVal: string) => {
        this.reset();
        const newValLower = newVal.toLocaleLowerCase();
        if (this.props.limit === 1) {
            this.query = newValLower.trim();
            this.searchUsernameTimeout(this.query);
            return;
        }
        if (newValLower.length > 1 && ', '.includes(newValLower[newValLower.length - 1])) {
            this.query = newValLower.substr(0, newValLower.length - 1).trim();
            this.tryAcceptUsername();
            return;
        }
        this.query = newValLower.trim();
    };

    // Don't use onKeyPress it won't catch backspace
    // Don't use onKeyUp - text change fires earlier
    handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && this.query !== '') {
            // if we are in 1-1 DM selection and user hits enter
            if (this.props.limit === 1) {
                const c = this.foundContact || (await this.searchUsername(this.query));
                // if we know for sure contact is there, then go to DM immediately
                if (c && !c.loading && !c.notFound && !c.isHidden) {
                    this.query = '';
                    this.selected = [c] as IObservableArray<Contact>;
                    this.accept();
                }
                return;
            }
            this.tryAcceptUsername();
        }
        if (e.key === 'Backspace' && this.query === '' && this.selected.length > 0) {
            this.selected.remove(this.selected[this.selected.length - 1]);
        }
    };

    searchUsernameTimeout(usernameOrEmail: string): void {
        if (this._searchUsernameTimeout) {
            clearTimeout(this._searchUsernameTimeout);
            this._searchUsernameTimeout = null;
        }
        if (!usernameOrEmail) return;
        this._searchUsernameTimeout = setTimeout(() => {
            transaction(() => {
                this._searchUsernameTimeout = null;
                this.searchUsername(usernameOrEmail);
            });
        }, 1000);
    }

    async searchUsername(usernameOrEmail: string): Promise<null | Contact> {
        if (!usernameOrEmail) return null;
        this.contactLoading = true;
        let c = await contactStore.whitelabel.getContact(usernameOrEmail, this.props.context);
        if (this.isExcluded(c)) {
            this.userAlreadyAdded = this.query;
            c = null;
        } else {
            const atInd = usernameOrEmail.indexOf('@');
            const isEmail = atInd > -1 && atInd === usernameOrEmail.lastIndexOf('@');
            const userHiddenOrNotFound = c.notFound || c.isHidden;
            this.userNotFound = userHiddenOrNotFound ? usernameOrEmail : '';
            this.suggestInviteEmail =
                userHiddenOrNotFound && isEmail && !this.props.noInvite ? usernameOrEmail : '';
            this.showNotFoundError = userHiddenOrNotFound;
            this.foundContact = !userHiddenOrNotFound && c;
        }
        this.contactLoading = false;
        return c;
    }

    async tryAcceptUsername() {
        this.reset();
        const c = await this.searchUsername(this.query);
        if (c === null || this.selected.find(s => s.username === this.query)) {
            return;
        }
        this.query = '';
        if (this.isExcluded(c)) {
            return;
        }
        this.selected.push(c);
        when(
            () => !c.loading,
            () => {
                setTimeout(() => {
                    if (c.notFound || c.isHidden) this.selected.remove(c);
                }, 1000);
            }
        );
    }

    accept = () => {
        if (this.query) {
            this.tryAcceptUsername();
            return;
        }
        if (this.props.onlyPick || this.accepted || !this.isValid) return;
        this.accepted = true;
        this.selected.forEach(s => {
            if (s.notFound || s.isHidden) this.selected.remove(s);
        });
        this.props.onAccept(this.selected);
    };

    onContactClick = (contact: Contact) => {
        // avoiding incorrect setState because of computed options
        setTimeout(() => {
            if (this.props.limit === 1) {
                this.selected.clear();
                this.selected.push(contact);
                this.query = '';
                this.accept();
            } else {
                this.query = '';
                if (this.isExcluded(contact)) return;
                if (this.selected.find(i => i.username === contact.username)) return;
                this.selected.push(contact);
            }
        });
    };

    invite = (context: string) => {
        contactStore.invite(this.suggestInviteEmail, context);
        this.query = '';
        this.reset();
    };

    render() {
        const selectedFiles = fileStore.selectedFiles;

        return (
            <div className={css('user-picker', this.props.className)}>
                <div
                    className={css('selected-items', {
                        banish: !this.props.sharing
                    })}
                >
                    <List clickable>
                        <ListHeading key="header" caption={t('title_selectedFiles')} />
                        {selectedFiles.map(f => (
                            <ListItem
                                key={f.id}
                                leftIcon="insert_drive_file"
                                caption={f.name}
                                rightIcon={
                                    selectedFiles.length > 1 ? 'remove_circle_outline' : undefined
                                }
                            />
                        ))}
                    </List>
                </div>
                <div className="inputs-container">
                    <div className="inputs-container-inner">
                        <div className="chat-creation-header-container">
                            {this.props.noHeader ? null : (
                                <div className="chat-creation-header">
                                    <div className="title">
                                        {this.props.title}
                                        {this.props.description && (
                                            <span className="description">
                                                {this.props.description}
                                            </span>
                                        )}
                                    </div>
                                    {this.props.closeable && (
                                        <Button
                                            icon="close"
                                            onClick={this.props.onClose}
                                            className="button-close"
                                        />
                                    )}
                                </div>
                            )}
                            <div className="message-search-wrapper">
                                <div className="message-search-inner">
                                    {this.props.isDM && <T k="title_to" className="title-to" />}
                                    <form className="new-chat-search">
                                        {/* HACK: wrapping entire div in `label` means that clicking
                                            anywhere in here will focus the input. */}
                                        <label htmlFor="user-search-input">
                                            <div className="chip-wrapper">
                                                {this.props.isDM
                                                    ? null
                                                    : this.selected.map(c => (
                                                          <Chip
                                                              key={c.username}
                                                              className={css({
                                                                  'not-found':
                                                                      c.notFound || c.isHidden
                                                              })}
                                                              onDeleteClick={() =>
                                                                  this.selected.remove(c)
                                                              }
                                                              deletable
                                                          >
                                                              {c.loading ? (
                                                                  <ProgressBar />
                                                              ) : (
                                                                  c.username
                                                              )}
                                                          </Chip>
                                                      ))}
                                                <SearchInput
                                                    inputId="user-search-input"
                                                    testId="input_userSearch"
                                                    placeholder={
                                                        this.selected.length
                                                            ? null
                                                            : routerStore.isNewChannel ||
                                                              routerStore.isPatientSpace
                                                            ? t('title_Members')
                                                            : routerStore.isNewPatient
                                                            ? t('mcr_title_newPatientRecord')
                                                            : t('title_userSearch')
                                                    }
                                                    value={this.query}
                                                    onChange={this.handleTextChange}
                                                    onKeyDown={this.handleKeyDown}
                                                    autoFocus={!this.props.noAutoFocus}
                                                    noHelperText
                                                />
                                            </div>

                                            {this.props.limit !== 1 &&
                                                this.props.onAccept &&
                                                !this.isRoomCreation && (
                                                    <Button
                                                        label={this.props.button || t('button_go')}
                                                        onClick={this.accept}
                                                        disabled={
                                                            !this.isValid ||
                                                            (this.queryIsEmpty &&
                                                                this.selected.length === 0)
                                                        }
                                                        theme="affirmative"
                                                        testId="button_createDm"
                                                    />
                                                )}
                                            {(this.contactLoading ||
                                                this._searchUsernameTimeout) && (
                                                <ProgressBar circular size="small" />
                                            )}
                                        </label>
                                    </form>
                                </div>
                                {this.isRoomCreation && (
                                    <div className="helper-text">
                                        <T k="title_userSearch" />. <T k="title_optional" />
                                    </div>
                                )}
                            </div>
                            {this.isRoomCreation && (
                                <div className="new-channel-button-container">
                                    <Button
                                        label={t('button_open')}
                                        // FIXME: is this supposed to be
                                        // `this.accept` and pass contacts back
                                        // to the caller?
                                        onClick={this.props.onAccept as any}
                                        disabled={this.props.noSubmit}
                                        theme="affirmative"
                                        testId="button_createRoom"
                                    />
                                </div>
                            )}
                        </div>
                        {this.showSearchError && (
                            <div className="user-search-error-container">
                                <UserSearchError
                                    userAlreadyAdded={this.userAlreadyAdded}
                                    userNotFound={
                                        this.showNotFoundError && !this.suggestInviteEmail
                                            ? this.userNotFound
                                            : null
                                    }
                                    suggestInviteEmail={this.suggestInviteEmail}
                                    onInvite={this.invite}
                                />
                            </div>
                        )}
                        <div className="user-list-container">
                            <List theme="large" clickable>
                                {this.foundContact &&
                                    renderContactList(
                                        null,
                                        [this.foundContact],
                                        this.onContactClick
                                    )}
                                {renderContactList(
                                    'title_favoriteContacts',
                                    this.options.favorites,
                                    this.onContactClick
                                )}
                                {renderContactList(
                                    'title_allContacts',
                                    this.options.normal,
                                    this.onContactClick
                                )}
                            </List>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function renderContactList(
    subHeading: keyof LocalizationStrings | null,
    contacts: Contact[],
    onContactClick: (contact: Contact) => void
): JSX.Element {
    if (!contacts.length) return null;
    return (
        <div key={subHeading} className="user-list">
            {!!subHeading && <ListHeading caption={`${t(subHeading)} (${contacts.length})`} />}
            {contacts.map(c => (
                <ListContact key={c.username} contact={c} onContactClick={onContactClick} />
            ))}
        </div>
    );
}

interface ListContactProps {
    contact: Contact;
    onContactClick: (contact: Contact) => void;
}

class ListContact extends React.Component<ListContactProps> {
    onClick = () => {
        this.props.onContactClick(this.props.contact);
    };
    render() {
        const { contact } = this.props;

        return (
            <ListItem
                leftContent={<Avatar key="a" contact={contact} size="medium" />}
                caption={contact.fullName}
                legend={contact.username}
                onClick={this.onClick}
                data-test-id={`listItem_${contact.username}`}
            />
        );
    }
}
