import React from 'react';
import { observer } from 'mobx-react';
import { observable, action, runInAction } from 'mobx';
import css from 'classnames';

import { contactStore, systemMessages, User, t } from 'peerio-icebear';
import { Chat, Message as IcebearMessage } from 'peerio-icebear/dist/models';
import { Button, MaterialIcon } from 'peer-ui';

import T from '~/ui/shared-components/T';
import AvatarWithPopup from '~/ui/contact/components/AvatarWithPopup';
import IdentityVerificationNotice from '~/ui/chat/components/IdentityVerificationNotice';
import ContactProfile from '~/ui/contact/components/ContactProfile';
import { time } from '~/helpers/formatter';
import uiStore from '~/stores/ui-store';
import config from '~/config';

import InlineFiles from './InlineFiles';
import { UrlPreviewHtml, UrlPreviewImage } from './UrlPreview';
import UrlPreviewConsent from './UrlPreviewConsent';
import InlineSharedFolder from '../../files/components/InlineSharedFolder';
import MessageText from './MessageText';

const urls = config.translator.urlMap;

interface MessageProps {
    /**
     * the active chat, as defined in icebear's chatStore singleton
     * (chatStore.activeChat) peerio-icebear/src/models/chats/chat.js
     */
    chat: Chat;

    /**
     * the message proper, defined in peerio-icebear/src/models/chats/message.js
     */
    message: IcebearMessage;

    /**
     * the message.groupWithPrevious field
     */
    light: boolean;

    /**
     * callback to ensure we stick to the bottom of the parent container.
     */
    onImageLoaded: () => void;
}

/**
 * IMPORTANT:
 * MessageList scroll retention logic relies on root element of this component to have
 * class name 'message-content-wrapper' at the first position in class list
 */
@observer
export default class Message extends React.Component<MessageProps> {
    @observable.shallow errorData: { error: Error; info: React.ErrorInfo } | null = null;
    @observable allowShowSendingState = false;
    @observable resendInProgress = false;

    @observable contactProfileActive = false;

    @action.bound
    closeContactProfile() {
        this.contactProfileActive = false;
    }

    timer?: NodeJS.Timer;

    componentDidMount() {
        if (!this.props.message.sending) return;
        this.timer = setTimeout(() => {
            if (this.props.message.sending) this.allowShowSendingState = true;
        }, 3000);
    }

    componentWillUnmount() {
        if (this.timer) clearTimeout(this.timer);
    }

    @observable clickedContact;
    @action.bound
    onClickContact(ev: React.MouseEvent) {
        this.clickedContact = contactStore.getContact(
            ev.currentTarget.attributes['data-username'].value
        );
        this.contactProfileActive = true;
    }

    renderSystemData(m) {
        // !! SECURITY: sanitize if you move this to something that renders dangerouslySetInnerHTML
        if (!m.systemData) return null;

        if (m.systemData.action === 'videoCall' && m.systemData.link) {
            const { link } = m.systemData;
            const shortLink = link.replace('https://', '');
            const videoCallMsg = systemMessages.getSystemMessageText(m);
            return (
                <div>
                    <p className="video-system-message">{videoCallMsg}</p>
                    <p>
                        <MaterialIcon icon="videocam" className="video-icon" />
                        <a href={link}>{shortLink}</a>
                    </p>
                </div>
            );
        }
        return (
            <div className="system-message selectable">
                <p>{systemMessages.getSystemMessageText(m)}</p>
                {m.systemData.action === 'join' && <IdentityVerificationNotice extraMargin />}
            </div>
        );
    }
    openMessageInfo = () => {
        uiStore.selectedMessage = this.props.message;
        uiStore.prefs.chatSideBarIsOpen = false;
    };
    renderReceipts(m) {
        if (!m.receipts || !m.receipts.length) {
            return <div key={`${m.tempId || m.id}receipts`} className="receipt-wrapper" />;
        }
        // yeah, we skip receipts signature errors so the 3 + X math won't really work that well in some cases
        // but it's ok, signature error is not a common thing, and there's a task in tracker to deal with this someday
        const renderMe = [];
        // if there's 1-6 receipts, we just render them
        // if more then 6 - we render 3 and (+X) number
        const limit = m.receipts.length > 6 ? 3 : m.receipts.length;
        for (let i = 0; i < limit && m.receipts.length > i; i++) {
            const r = m.receipts[i];
            if (r.receipt.signatureError) continue;
            renderMe.push(
                <AvatarWithPopup
                    key={r.username}
                    contact={contactStore.getContact(r.username)}
                    size="tiny"
                    tooltip
                />
            );
        }

        return (
            <div key={`${m.tempId || m.id}receipts`} className="receipt-wrapper">
                {renderMe}
                {m.receipts.length > 6 && (
                    <div onClick={this.openMessageInfo} className="plus-receipts">
                        +{m.receipts.length - 3}
                    </div>
                )}
            </div>
        );
    }

    @action.bound
    handleRetry(m) {
        this.allowShowSendingState = true;
        this.resendInProgress = true;
        m.send();
    }

    componentDidCatch(error, info) {
        runInAction(() => {
            this.errorData = { error, info };
        });
    }

    render() {
        const m = this.props.message;

        if (this.errorData) {
            return renderError(this.errorData, m);
        }

        const invalidSign = m.signatureError === true;

        return (
            <div
                className={css('message-content-wrapper', {
                    'invalid-sign': invalidSign,
                    'send-error': m.sendError || this.resendInProgress,
                    light: this.props.light,
                    selected: m === uiStore.selectedMessage
                })}
            >
                <div className="message-content-wrapper-inner">
                    {this.props.light ? (
                        <div className="timestamp">{time.format(m.timestamp).split(' ')[0]}</div>
                    ) : (
                        <AvatarWithPopup contact={m.sender} size="medium" tooltip />
                    )}
                    <div className="message-content">
                        {this.props.light ? null : (
                            <div className="meta-data">
                                <div className="user selectable">
                                    {m.sender.fullName}&nbsp;
                                    <span className="username selectable">{m.sender.username}</span>
                                </div>
                                <div className="timestamp selectable">
                                    {time.format(m.timestamp)}
                                </div>
                            </div>
                        )}
                        <div className="message-body">
                            {m.systemData || m.files || m.folders ? null : (
                                <MessageText
                                    message={m}
                                    onClickContact={this.onClickContact}
                                    currentUsername={User.current.username}
                                />
                            )}
                            {m.files || m.folders ? (
                                <div className="inline-files-and-optional-message">
                                    {m.folders
                                        ? m.folders.map(f => {
                                              return (
                                                  <InlineSharedFolder
                                                      key={f}
                                                      folderId={f}
                                                      sharedByMe={
                                                          m.sender.username ===
                                                          User.current.username
                                                      }
                                                  />
                                              );
                                          })
                                        : null}
                                    {m.files ? (
                                        <InlineFiles
                                            files={m.files}
                                            onImageLoaded={this.props.onImageLoaded}
                                        />
                                    ) : null}
                                    {!!m.text && (
                                        <div className="optional-message">
                                            <MessageText
                                                message={m}
                                                onClickContact={this.onClickContact}
                                                currentUsername={User.current.username}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : null}
                            {/* SECURITY: sanitize if you change this to  render in dangerouslySetInnerHTML */
                            this.renderSystemData(m)}
                            {m.externalWebsites.map((urlData, ind) => (
                                <UrlPreviewHtml
                                    key={ind} // eslint-disable-line react/no-array-index-key
                                    urlData={urlData}
                                    onImageLoaded={this.props.onImageLoaded}
                                />
                            ))}
                            {m.externalImages.map((urlData, ind) => (
                                <UrlPreviewImage
                                    key={ind} // eslint-disable-line react/no-array-index-key
                                    urlData={urlData}
                                    onImageLoaded={this.props.onImageLoaded}
                                />
                            ))}
                            {!uiStore.prefs.externalContentConsented && m.hasUrls && (
                                <UrlPreviewConsent />
                            )}
                        </div>
                        {/* m.inlineImages.map(url => (
                            <img key={url} className="inline-image" onLoad={this.props.onImageLoaded} src={url} />)) */}
                        {m.sendError || (this.allowShowSendingState && m.sending) ? (
                            <div
                                className={css('send-error-options', {
                                    'send-in-progress': m.sending
                                })}
                            >
                                <MaterialIcon icon={m.sending ? 'autorenew' : 'error_outline'} />
                                <T
                                    k={m.sending ? 'title_sendRetry' : 'error_messageNotSent'}
                                    className="send-error-text"
                                />
                                <a
                                    onClick={m.sending ? null : () => this.handleRetry(m)}
                                    className={css({ disabled: m.sending })}
                                >
                                    <T k="button_tryAgain" />
                                </a>
                                <a onClick={() => this.props.chat.removeMessage(m)}>
                                    <T k="button_remove" />
                                </a>
                            </div>
                        ) : null}
                    </div>
                    {this.renderReceipts(m)}
                </div>
                {invalidSign ? (
                    <div className="invalid-sign-warning">
                        <MaterialIcon icon="error_outline_circle" className="warning-icon" />
                        <div className="content">{t('error_invalidMessageSignature')}</div>
                        <Button href={urls.msgSignature} label={t('title_readMore')} />
                    </div>
                ) : null}

                <ContactProfile
                    active={this.contactProfileActive}
                    onCancel={this.closeContactProfile}
                    contact={this.clickedContact}
                />
            </div>
        );
    }
}

function renderError(
    errorData: { error: Error; info: { componentStack: string } },
    msg: IcebearMessage
) {
    console.error('Error rendering the following message:');
    console.dir(msg);
    // If you change any tags or styles in here, make sure all text remains selectable
    // (The CSS property "user-select" isn't inherited!)
    return (
        <div className="message-content-wrapper render-error">
            <div className="message-content-wrapper-inner">
                <div className="message-content">
                    <div className="message-body">
                        <p>
                            <strong>{t('error_messageErrorHeader')}:</strong>
                        </p>
                        <p>{errorData.error.toString()}</p>
                        <br />
                        <p>
                            <strong>{t('error_messageErrorMessageInfo')}:</strong>
                        </p>
                        {// We can't just stringify the message keg, it's not plain data and can be circular
                        /* eslint-disable prefer-template, react/no-array-index-key */
                        msg ? (
                            <ul>
                                {[
                                    `${t('error_messageErrorSenderName')}: ` +
                                        (msg.sender && msg.sender.username),
                                    `${t('error_messageErrorMessageId')}: ${msg.id}`,
                                    `${t('error_messageErrorTimestamp')}: ` +
                                        (msg.timestamp && msg.timestamp.toLocaleString()),
                                    `${t('error_messageErrorMessagePlaintext')}: ${msg.text}`,
                                    `${t('error_messageErrorMessageRichtext')}: ` +
                                        (msg.richText && JSON.stringify(msg.richText, undefined, 2))
                                ].map((l, i) => (
                                    <li key={i}>{l}</li>
                                ))}
                            </ul>
                        ) : (
                            t('error_messageErrorNotAvailable')
                        )
                        /* eslint-enable prefer-template, react/no-array-index-key */
                        }
                        <br />
                        <p>
                            <strong>{t('error_messageErrorAdditionalInfo')}:</strong>
                        </p>
                        <p>{errorData.info && errorData.info.componentStack}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
