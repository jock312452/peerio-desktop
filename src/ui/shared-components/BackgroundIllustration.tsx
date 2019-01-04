import React from 'react';

export default function BackgroundIllustration(props: {
    /** source file path */
    src: string;

    /** image height (px) */
    height: number;

    /** image width (px) */
    width: number;

    /** image distance from bottom */
    distance: number;
}) {
    return (
        <div className="background-illustration">
            <img
                src={props.src}
                style={{ height: props.height, width: props.width, bottom: props.distance }}
                draggable={false}
            />
        </div>
    );
}
