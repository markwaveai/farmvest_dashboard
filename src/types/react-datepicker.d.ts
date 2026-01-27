declare module 'react-datepicker' {
    import * as React from 'react';

    export interface ReactDatePickerProps {
        selected?: Date | null;
        onChange: (date: Date | null, event?: React.SyntheticEvent<any> | undefined) => void;
        onSelect?: (date: Date, event?: React.SyntheticEvent<any> | undefined) => void;
        minDate?: Date | null;
        maxDate?: Date | null;
        startDate?: Date | null;
        endDate?: Date | null;
        dateFormat?: string | string[];
        showMonthYearPicker?: boolean;
        showFullMonthYearPicker?: boolean;
        showTwoColumnMonthYearPicker?: boolean;
        showYearPicker?: boolean;
        className?: string;
        placeholderText?: string;
        onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
        popperClassName?: string;
        popperPlacement?: string;
        [key: string]: any;
    }

    export default class DatePicker extends React.Component<ReactDatePickerProps> { }
}
