/* eslint-disable react/no-danger */
import React from 'react';
import { IObservableArray } from 'mobx';
import { observer } from 'mobx-react';

import { fileHelpers, t } from 'peerio-icebear';
import { File, FileFolder } from 'peerio-icebear/dist/models';
import T from '~/ui/shared-components/T';
import { Button, MaterialIcon, ProgressBar } from 'peer-ui';
import FileSpriteIcon from '~/ui/shared-components/FileSpriteIcon';

@observer
export default class ShareToChatProgress extends React.Component<{
    /** Queue of individual files that are in line for upload */
    uploadQueue: IObservableArray<File>;

    /**
     * Queue of in-app folders that are in line to be converted to shared folders
     * and then shared with the current chat.
     */
    folderShareQueue: IObservableArray<FileFolder>;
}> {
    // TODO: handle folder share cancel once available
    handleCancel(item) {
        if (confirm(t('title_confirmCancelUpload'))) {
            item.cancelUpload();
        }
    }

    render() {
        const uploads = this.props.uploadQueue || [];
        const folders = this.props.folderShareQueue || [];
        if (!uploads.length && !folders.length) return null;
        const item = (uploads.length && uploads[0]) || (folders.length && folders[0]); // mobx complains when accessing array index that doesn't exist
        const queued = uploads.length + folders.length - 1;
        const { progress, progressMax, progressPercentage } = item;
        const uploadProgressPercentage = progress ? Math.floor((progress / progressMax) * 100) : 0;
        const fileType = fileHelpers.getFileIconType(fileHelpers.getFileExtension(item.name));

        return (
            <div className="share-to-chat-progress">
                <div className="info">
                    {item.isFolder ? (
                        <MaterialIcon icon="folder" />
                    ) : queued ? (
                        <MaterialIcon icon="cloud_upload" />
                    ) : (
                        <FileSpriteIcon type={fileType} size="small" />
                    )}
                    <div className="text">
                        {item.isFolder ? (
                            <div>
                                <T k="title_sharing" tag="span" />
                                &nbsp;
                                <span>
                                    <i>{item.name}</i>
                                </span>
                                {/* <span className="items-left">({t('title_itemsLeft', { number: 4 })})</span> */}
                            </div>
                        ) : queued ? (
                            <T k="title_queuedFiles" tag="span">
                                {{ name: item.name, remaining: queued }}
                            </T>
                        ) : (
                            <T k="title_uploadingAndEncrypting" tag="span">
                                {{ name: item.name }}
                            </T>
                        )}
                    </div>
                    <div className="percent-progress">
                        <span>
                            {item.isFolder
                                ? `${progressPercentage}%`
                                : queued
                                ? null
                                : `${uploadProgressPercentage}%`}
                        </span>

                        {item.isFolder ? null : !progress || progress < progressMax ? ( // TODO: mocks show ability to cancel folder share-in-progress as well
                            <Button
                                icon="cancel"
                                onClick={() => this.handleCancel(item)}
                                className="right-icon"
                            />
                        ) : null}

                        {!queued && progress && progress >= progressMax ? (
                            <MaterialIcon icon="check" className="affirmative right-icon" />
                        ) : null}
                    </div>
                </div>

                {queued ? <ProgressBar /> : <ProgressBar value={progress || 0} max={progressMax} />}
            </div>
        );
    }
}
