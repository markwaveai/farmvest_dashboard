declare module 'react-quill-new' {
    import React from 'react';

    export interface UnprivilegedEditor {
        getLength(): number;
        getText(index?: number, length?: number): string;
        getHTML(): string;
        getBounds(index: number, length?: number): ClientRect;
        getSelection(focus?: boolean): RangeStatic;
        getContents(index?: number, length?: number): any;
    }

    export interface RangeStatic {
        index: number;
        length: number;
    }

    export interface ReactQuillProps {
        bounds?: string | HTMLElement;
        children?: React.ReactElement<any>;
        className?: string;
        defaultValue?: string;
        formats?: string[];
        id?: string;
        modules?: any;
        onChange?: (content: string, delta: any, source: string, editor: UnprivilegedEditor) => void;
        onChangeSelection?: (range: RangeStatic, source: string, editor: UnprivilegedEditor) => void;
        onFocus?: (range: RangeStatic, source: string, editor: UnprivilegedEditor) => void;
        onBlur?: (previousRange: RangeStatic, source: string, editor: UnprivilegedEditor) => void;
        onKeyPress?: React.EventHandler<any>;
        onKeyDown?: React.EventHandler<any>;
        onKeyUp?: React.EventHandler<any>;
        placeholder?: string;
        preserveWhitespace?: boolean;
        readOnly?: boolean;
        scrollingContainer?: string | HTMLElement;
        style?: React.CSSProperties;
        tabIndex?: number;
        theme?: string;
        value?: string;
    }

    export default class ReactQuill extends React.Component<ReactQuillProps> {
        focus(): void;
        blur(): void;
        getEditor(): any;
    }
}
