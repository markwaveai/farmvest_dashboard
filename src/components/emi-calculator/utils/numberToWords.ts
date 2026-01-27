export const numberToIndianWords = (num: number): string => {
    if (num === 0) return 'Zero';

    const words = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return '';
        if (n < 20) return words[n];
        const res = tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
        return res;
    };

    const convert = (n: number): string => {
        if (n === 0) return '';

        let res = '';

        // Crores
        if (n >= 10000000) {
            res += convert(Math.floor(n / 10000000)) + ' Crore ';
            n %= 10000000;
        }

        // Lakhs
        if (n >= 100000) {
            res += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
            n %= 100000;
        }

        // Thousands
        if (n >= 1000) {
            res += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
            n %= 1000;
        }

        // Hundreds
        if (n >= 100) {
            res += words[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }

        // Tens and Ones
        if (n > 0) {
            res += convertLessThanThousand(n);
        }

        return res.trim();
    };

    return convert(num);
};
