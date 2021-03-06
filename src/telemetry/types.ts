export type DurationEvent = [
    string,
    {
        item?: string;
        location?: string;
        sublocation?: string;
        totalTime: number;
    }
];

export type TextInputEvent = [
    string,
    {
        item: string;
        location?: string;
        sublocation?: string;
        state: string;
        errorType?: string;
    }
];

export type ValidatedInputObject = {
    item: string;
    location?: string;
    sublocation?: string;
    errorMsg?: string;
};
