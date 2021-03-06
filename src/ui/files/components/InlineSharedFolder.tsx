import React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { Button, MaterialIcon } from 'peer-ui';
import { fileStore, chatStore, volumeStore, t } from 'peerio-icebear';
import { Volume } from 'peerio-icebear/dist/models';

import routerStore from '~/stores/router-store';
import T from '~/ui/shared-components/T';

import SharedFolderActions from './SharedFolderActions';

interface InlineSharedFolderProps {
    folderId: string;
    sharedByMe: boolean;
}

@observer
export default class InlineSharedFolder extends React.Component<InlineSharedFolderProps> {
    private get volume() {
        return fileStore.folderStore.getById(this.props.folderId) as Volume;
    }

    private get isShared() {
        return !!this.volume.allParticipants.find(
            p => p.username === chatStore.activeChat.dmPartnerUsername
        );
    }

    private readonly click = () => {
        fileStore.folderStore.currentFolder = this.volume;
        routerStore.navigateTo(routerStore.ROUTES.files);
    };

    @action.bound
    private unshareFolder() {
        const contact = chatStore.activeChat.otherParticipants[0];
        this.volume.removeParticipants([contact]);
    }

    @action.bound
    private reshareFolder() {
        const contact = chatStore.activeChat.otherParticipants[0];
        this.volume.addParticipants([contact]);
    }

    render() {
        const volume = this.volume;
        if (!volume) {
            if (volumeStore.loaded) {
                return (
                    <div className="inline-files-container inline-shared-folder-container">
                        <div className="unknown-file">{t('title_folderUnshared')}</div>
                    </div>
                );
            }
            return null;
        }
        return (
            <div
                className={css('inline-files-container', 'inline-shared-folder-container', {
                    unshared: !this.isShared
                })}
            >
                <div className="inline-files">
                    <div className="shared-file inline-files-topbar">
                        <div className="container">
                            <div className="file-name-container clickable" onClick={this.click}>
                                <div className="file-icon">
                                    <MaterialIcon
                                        icon={this.isShared ? 'folder_shared' : 'folder'}
                                    />
                                </div>
                                <div className="file-name">
                                    {this.isShared ? (
                                        volume.name
                                    ) : (
                                        <T k="title_folderNameUnshared">
                                            {{ folderName: volume.name }}
                                        </T>
                                    )}
                                </div>
                            </div>
                            {this.props.sharedByMe ? (
                                this.isShared ? (
                                    <SharedFolderActions
                                        onShare={null}
                                        onDownload={null}
                                        onUnshare={this.unshareFolder}
                                        onDelete={null}
                                    />
                                ) : (
                                    <Button
                                        label={t('button_reshare')}
                                        onClick={this.reshareFolder}
                                    />
                                )
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
