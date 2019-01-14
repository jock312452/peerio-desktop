import React from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';

import { contactStore, fileStore, User, t } from 'peerio-icebear';
import { File } from 'peerio-icebear/dist/models';
import { Checkbox, Menu, ProgressBar, Tooltip } from 'peer-ui';

import T from '~/ui/shared-components/T';
import ContactProfile from '~/ui/contact/components/ContactProfile';
import FileSpriteIcon from '~/ui/shared-components/FileSpriteIcon';
import Beacon from '~/ui/shared-components/Beacon';

import { downloadFile } from '~/helpers/file';

import FileActions from './FileActions';
import FileFolderDetailsRow from './FileFolderDetailsRow';
import { isFileOwnedByCurrentUser } from '../helpers/sharedFileAndFolderActions';

import { FileBeaconContext } from '../helpers/fileBeaconContext';

interface FileLineProps {
    file: File;
    checkbox: boolean;
    isDragging?: boolean;
    className?: string;
    clickToSelect?: true;
    fileDetails?: true;
    fileDetailsMini?: boolean;
    fileActions?: true;
}

@observer
export default class FileLine extends React.Component<FileLineProps> {
    // 21 hour limit for displaying relative timestamp (because moment.js says '1 day' starting from 21h)
    static readonly relativeTimeDisplayLimit = 21 * 60 * 60 * 1000;

    @observable hovered = false;

    @observable clickedContact; // TODO/TS: icebear contact

    @observable contactProfileActive = false;

    @action.bound
    closeContactProfile() {
        this.contactProfileActive = false;
    }

    @action.bound
    onMenuClick() {
        this.hovered = true;
    }

    @action.bound
    onMenuHide() {
        this.hovered = false;
    }

    // When dialog is opened by FileActions menu, clear the selection and select only this file
    readonly onActionInProgress = () => {
        fileStore.clearSelection();
        this.toggleSelected();
    };

    // Most actions will clear file selection on their own, but this will handle actions that don't.
    onActionComplete() {
        fileStore.clearSelection();
    }

    readonly cancelUploadOrDownload = () => {
        this.props.file.cancelUpload();
        this.props.file.cancelDownload();
    };

    readonly download = () => {
        downloadFile(this.props.file);
    };

    readonly deleteFile = () => {
        let msg = t('title_confirmRemoveFilename', {
            name: this.props.file.name
        });
        if (this.props.file.shared && isFileOwnedByCurrentUser(this.props.file)) {
            msg += `\n\n${t('title_confirmRemoveSharedFiles')}`;
        }
        if (confirm(msg)) {
            this.props.file.remove();
        }
    };

    @action.bound
    toggleSelected() {
        this.props.file.selected = !this.props.file.selected;
    }

    @action.bound
    openContact() {
        this.clickedContact = contactStore.getContact(this.props.file.fileOwner);
        this.contactProfileActive = true;
    }

    static contextType = FileBeaconContext;

    fileNameConditionalBeacon = children => {
        if (this.context.firstReceivedFileId === this.props.file.fileId) {
            return (
                <Beacon
                    name="receivedFile"
                    type="area"
                    arrowPosition="top"
                    arrowDistance={20}
                    offsetY={24}
                    description={t('description_receivedFile_beacon')}
                    markReadOnUnmount
                >
                    {children}
                </Beacon>
            );
        }
        return children;
    };

    fileActionsConditionalBeacon = children => {
        if (this.context.firstListedFileId === this.props.file.fileId) {
            return (
                <Beacon
                    name="fileOptions"
                    type="spot"
                    position="right"
                    description={t('description_moreFiles_beacon')}
                    onContentClick={this.onFileActionsBeaconClick}
                    markReadOnUnmount
                >
                    {children}
                </Beacon>
            );
        }
        return children;
    };

    fileActionsMenuRef = React.createRef<Menu>();

    onFileActionsBeaconClick = () => {
        this.fileActionsMenuRef.current.handleMenuClick();
    };

    render() {
        const { file, isDragging } = this.props;

        return (
            /*
                            This superfluous row-container is needed to make styles consistent with
                            FolderLine, which *does* need the container to hold elements other than .row
                        */
            <div
                className={css('row-container', 'file-row-container', this.props.className, {
                    hover: this.hovered,
                    selected: file.selected,
                    'selected-row': file.selected,
                    'waiting-3rd-party': !file.uploading && !file.readyForDownload,
                    'dragged-row': isDragging
                })}
            >
                <div className="row">
                    {this.props.checkbox ? (
                        <Checkbox
                            className="file-checkbox"
                            checked={file.selected}
                            onChange={this.toggleSelected}
                        />
                    ) : (
                        <div className="file-checkbox" />
                    )}
                    <div
                        className="file-icon"
                        onClick={this.props.clickToSelect ? this.toggleSelected : this.download}
                    >
                        <FileSpriteIcon type={file.iconType} size="medium" />
                    </div>

                    <div className="file-name">
                        {this.fileNameConditionalBeacon(
                            <span
                                className="clickable"
                                onClick={
                                    this.props.clickToSelect ? this.toggleSelected : this.download
                                }
                            >
                                {this.props.file.name}
                            </span>
                        )}
                        {this.props.fileDetailsMini && (
                            <FileFolderDetailsRow file={this.props.file} />
                        )}
                    </div>

                    {this.props.fileDetails && (
                        <div className="file-owner clickable" onClick={this.openContact}>
                            {file.fileOwner === User.current.username
                                ? `${t('title_you')}`
                                : file.fileOwner}
                        </div>
                    )}
                    {this.props.fileDetails && (
                        <div className="file-uploaded" title={file.uploadedAt.toLocaleString()}>
                            {file.uploadTimeFormatted}
                            {file.isLegacy && (
                                <div className="badge-old-version">
                                    <T k="title_pending" />
                                    <Tooltip text={t('title_oldVersionTooltip')} />
                                </div>
                            )}
                        </div>
                    )}
                    {this.props.fileDetails && (
                        <div className="file-size">{file.sizeFormatted}</div>
                    )}
                    {this.props.fileActions &&
                        this.fileActionsConditionalBeacon(
                            <div className="file-actions">
                                <FileActions
                                    file={this.props.file}
                                    onMenuClick={this.onMenuClick}
                                    onMenuHide={this.onMenuHide}
                                    onActionInProgress={this.onActionInProgress}
                                    onActionComplete={this.onActionComplete}
                                    onDelete={this.deleteFile}
                                    menuRef={this.fileActionsMenuRef}
                                />
                            </div>
                        )}
                </div>

                {file.downloading || file.uploading ? (
                    <ProgressBar value={file.progress} max={file.progressMax} />
                ) : null}

                {this.props.fileDetails && (
                    <ContactProfile
                        active={this.contactProfileActive}
                        onCancel={this.closeContactProfile}
                        contact={this.clickedContact}
                    />
                )}
            </div>
        );
    }
}
