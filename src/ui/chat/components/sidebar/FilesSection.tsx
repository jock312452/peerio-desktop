import React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';

import { List, ListItem, Menu, MenuItem } from 'peer-ui';
import { chatStore, contactStore, fileStore, t, User } from 'peerio-icebear';
import { File } from 'peerio-icebear/dist/models';

import T from '~/ui/shared-components/T';
import FileSpriteIcon from '~/ui/shared-components/FileSpriteIcon';
import ShareWithMultipleDialog from '~/ui/shared-components/ShareWithMultipleDialog';
import { getAttributeInParentChain } from '~/helpers/dom';
import { downloadFile, pickLocalFiles } from '~/helpers/file';
import SideBarSection from './SideBarSection';

interface FilesSectionProps {
    onToggle?: () => void;
    open: boolean;
}

@observer
export default class FilesSection extends React.Component<FilesSectionProps> {
    shareWithMultipleDialog = React.createRef<ShareWithMultipleDialog>();

    isUnmounted = false;

    @action.bound
    async share(ev: React.MouseEvent) {
        ev.stopPropagation();
        const fileId = getAttributeInParentChain(ev.currentTarget, 'data-fileid');
        const file = fileStore.getByIdInChat(fileId, chatStore.activeChat.id);
        await file.ensureLoaded();
        if (this.isUnmounted || file.deleted) return;
        const contacts = await this.shareWithMultipleDialog.current!.show(null, 'sharefiles');
        if (!contacts || !contacts.length) return;
        contacts.forEach(c => chatStore.startChatAndShareFiles([c], file));
    }

    componentDidMount() {
        this.isUnmounted = false;
    }

    componentWillUnmount() {
        this.isUnmounted = true;
    }

    @action.bound
    async download(ev: React.MouseEvent) {
        ev.stopPropagation();
        const fileId = getAttributeInParentChain(ev.currentTarget, 'data-fileid');
        const file = fileStore.getByIdInChat(fileId, chatStore.activeChat.id);
        await file.ensureLoaded();
        if (file.deleted) return;
        downloadFile(file);
    }

    stopPropagation(ev: React.MouseEvent) {
        ev.stopPropagation();
    }

    readonly handleUpload = async () => {
        const chat = chatStore.activeChat;
        if (!chat) return;

        const paths = await pickLocalFiles();
        if (!paths || !paths.length) return;

        await Promise.all(paths.map(i => chat.uploadAndShareFile(i)));
    };

    menu(file: File) {
        return (
            <Menu
                icon="more_vert"
                position="bottom-right"
                onClick={this.stopPropagation}
                data-fileid={file.fileId}
            >
                <MenuItem
                    caption={t('title_download')}
                    icon="file_download"
                    onClick={this.download}
                />
                <MenuItem
                    caption={t('button_share')}
                    icon="person_add"
                    onClick={this.share}
                    disabled={!file.canShare}
                />
            </Menu>
        );
    }

    readonly renderFileItem = (file: File) => {
        const fileOwnerFullName =
            file.fileOwner === User.current.username
                ? t('title_you')
                : contactStore.getContact(file.fileOwner).fullName;

        return (
            <ListItem
                key={file.fileId}
                data-fileid={file.fileId}
                className="sidebar-file-container"
                onClick={this.download}
                leftContent={<FileSpriteIcon type={file.iconType} size="medium" />}
                rightContent={this.menu(file)}
            >
                <div className="meta">
                    <div className="file-name-container">
                        <span className="file-name">{file.nameWithoutExtension}</span>
                        <span className="file-ext">.{file.ext}</span>
                    </div>
                    <div className="file-shared-by">{fileOwnerFullName}</div>
                </div>
            </ListItem>
        );
    };

    render() {
        const chat = chatStore.activeChat;
        if (!chat) return null;
        const textParser = {
            clickHere: (text: string) => (
                <a className="clickable" onClick={this.handleUpload}>
                    {text}
                </a>
            )
        };
        return (
            <SideBarSection
                title={t('title_recentFiles')}
                onToggle={this.props.onToggle}
                open={this.props.open}
            >
                <div className="member-list scrollable">
                    <List className="sidebar-file-list" clickable>
                        {chat.recentFiles.map(this.renderFileItem)}
                    </List>
                </div>
                {!chat.recentFiles.length && (
                    <div className="sidebar-zero-files">
                        <T k="title_noRecentFiles">{textParser}</T>
                    </div>
                )}
                <ShareWithMultipleDialog ref={this.shareWithMultipleDialog} />
            </SideBarSection>
        );
    }
}
