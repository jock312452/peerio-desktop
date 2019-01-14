import React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';
import { fileStore, t } from 'peerio-icebear';
import { Button, MaterialIcon } from 'peer-ui';
import T from '~/ui/shared-components/T';
import FileSpriteIcon from '~/ui/shared-components/FileSpriteIcon';
import { ExternalWebsite, ExternalImage } from 'peerio-icebear/dist/helpers/unfurl/types';
import css from 'classnames';

const forceShowCache = observable.map();

@observer
export class UrlPreviewHtml extends React.Component<{
    urlData: ExternalWebsite;
    onImageLoaded?: () => void;
}> {
    @observable expanded = true;

    @action.bound
    toggleExpand() {
        this.expanded = !this.expanded;
    }

    @computed get isToggleVisible() {
        return !!(this.props.urlData.title || this.props.urlData.description);
    }

    render() {
        const { url, title, siteName, description, image, imageAlt } = this.props.urlData;
        return (
            <div className="url-preview">
                <div className="url-info">
                    <UrlPreviewHeader
                        text={this.props.urlData.siteName || this.props.urlData.url}
                        favicon={
                            this.props.urlData.favicon ? this.props.urlData.favicon.url : undefined
                        }
                        expandToggleVisible={this.isToggleVisible}
                        onToggleExpand={this.toggleExpand}
                        expanded={this.expanded}
                    />
                </div>

                {this.expanded ? (
                    <div className="preview-content">
                        <div className="preview-text">
                            <a href={url}>{title || siteName}</a>
                            {description ? <div className="description">{description}</div> : null}
                        </div>
                        {image ? (
                            <div className="url-image">
                                <img
                                    src={image.url}
                                    alt={imageAlt || ''}
                                    onLoad={this.props.onImageLoaded}
                                />
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    }
}

@observer
export class UrlPreviewImage extends React.Component<{
    urlData: ExternalImage;
    onImageLoaded?: () => void;
}> {
    @observable expanded = true;

    @action.bound
    toggleExpand() {
        this.expanded = !this.expanded;
    }

    forceDownload = () => {
        forceShowCache.set(this.props.urlData.url, true);
    };

    render() {
        const { url, isOversizeCutoff, isOverInlineSizeLimit, isInsecure } = this.props.urlData;
        const tooBig = !isOversizeCutoff && isOverInlineSizeLimit;
        const showImage = forceShowCache.get(url) || (!tooBig && !isOversizeCutoff);

        return (
            <div className="url-preview">
                <div className="url-info">
                    <UrlPreviewHeader
                        text={this.expanded ? t('title_collapsePreview') : t('title_expandPreview')}
                        spriteIcon="img"
                        expandToggleVisible
                        onToggleExpand={this.toggleExpand}
                        expanded={this.expanded}
                        clickableText
                    />
                </div>

                {this.expanded ? (
                    <div className="preview-content">
                        <div className="url-image">
                            {!showImage && tooBig && (
                                <div className="image-over-limit-warning">
                                    <T k="title_imageSizeWarning">
                                        {{
                                            size: fileStore.inlineImageSizeLimitFormatted
                                        }}
                                    </T>
                                    <Button
                                        className="display-this-image display-over-limit-image"
                                        onClick={this.forceDownload}
                                    >
                                        {t('button_displayThisImageAfterWarning')}
                                    </Button>
                                </div>
                            )}
                            {isOversizeCutoff && (
                                <div className="image-over-limit-warning">
                                    <T k="title_imageTooBigCutoff">
                                        {{
                                            size: fileStore.inlineImageSizeLimitCutoffFormatted
                                        }}
                                    </T>
                                </div>
                            )}
                            {showImage &&
                                (isInsecure ? (
                                    <div className="image-insecure">
                                        <div className="image-insecure-text">
                                            <T k="title_insecureImagePreviewWarning" />
                                        </div>
                                    </div>
                                ) : (
                                    <img src={url} onLoad={this.props.onImageLoaded} />
                                ))}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

@observer
class UrlPreviewHeader extends React.Component<{
    spriteIcon?: string;
    favicon?: string;
    text: string;
    expandToggleVisible?: boolean;
    onToggleExpand: () => void;
    expanded: boolean;
    clickableText?: boolean;
}> {
    render() {
        return (
            <div className="url-preview-header">
                <span className="favicon">
                    {this.props.spriteIcon ? (
                        <FileSpriteIcon type={this.props.spriteIcon} size="small" />
                    ) : this.props.favicon ? (
                        <img src={this.props.favicon} alt="" />
                    ) : (
                        <MaterialIcon icon="language" />
                    )}
                </span>
                <span
                    className={css('site-name', { clickable: this.props.clickableText })}
                    onClick={this.props.clickableText ? this.props.onToggleExpand : null}
                >
                    {this.props.text}
                </span>

                {this.props.expandToggleVisible ? (
                    <Button
                        icon={this.props.expanded ? 'arrow_drop_up' : 'arrow_drop_down'}
                        onClick={this.props.onToggleExpand}
                    />
                ) : null}
            </div>
        );
    }
}
