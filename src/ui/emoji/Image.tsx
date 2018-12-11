import React from 'react';
import { observer } from 'mobx-react';
import css from 'classnames';

import { emojiByCanonicalShortname } from '~/helpers/chat/emoji';

interface EmojiImageProps {
    emoji: string;
    className?: string;
    size?: 'large';
}

/**
 * This component returns an individual image file of an emoji, rather than
 * using the spritesheets.
 */
@observer
export default class EmojiImage extends React.Component<EmojiImageProps> {
    render() {
        return (
            <img
                className={css('emoji-image', this.props.size, this.props.className)}
                title={this.props.emoji}
                src={emojiByCanonicalShortname[`:${this.props.emoji}:`].filename}
            />
        );
    }
}
