import React, { useState } from 'react';
import './Support.css';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
    question: string;
    answer: string;
}

const FAQS: FAQ[] = [
    {
        question: 'What is a Murrah buffalo and how can I identify it?',
        answer:
            'The Murrah buffalo is one of the best dairy buffalo breeds in India, well known for its high milk yield, strong genetics, and adaptability to different climatic conditions.\n\n' +
            'Identification features of Murrah Buffalo:\n' +
            '• Jet-black skin color\n' +
            '• Short, tightly curved horns (spiral shape)\n' +
            '• Broad head with a prominent forehead\n' +
            '• Well-developed udder\n' +
            '• Strong and compact body structure\n' +
            '• High milk-producing capacity',
    },
    {
        question: 'How can I identify a female Murrah buffalo in India?',
        answer:
            'A female Murrah buffalo can be identified using the following characteristics:\n\n' +
            '• Deep black skin without patches\n' +
            '• Medium to large body size\n' +
            '• Small, thick, and tightly curved horns\n' +
            '• Well-shaped udder with evenly placed teats\n' +
            '• Calm temperament and good feeding response\n' +
            '• High milk yield potential\n\n' +
            'All female Murrah buffaloes provided through Animal Kart are carefully selected and verified by experts.',
    },
    {
        question:
            'After purchasing, how does delivery work and why is there a 6-month gap for the next buffalo unit?',
        answer:
            'When you purchase 1 unit, you receive:\n\n' +
            '• 2 Murrah buffaloes\n' +
            '• 2 calves\n\n' +
            'Delivery cycle explanation:\n' +
            '• 1 Murrah buffalo + 1 calf will be transported to the farm within 1 month\n' +
            '• The remaining 1 Murrah buffalo + 1 calf will be imported and delivered within 6 months\n\n' +
            'This structured cycle ensures:\n' +
            '• Continuous monthly revenue\n' +
            '• Proper quarantine and health monitoring\n' +
            '• Reduced operational risk\n' +
            '• Better long-term profitability\n\n' +
            'This delivery cycle is designed to maximize income stability and overall profit.',
    },
    {
        question: 'Why is CPF (Cattle Protection Fund) mandatory?',
        answer:
            'CPF is mandatory to ensure complete protection and long-term security of your livestock investment.\n\n' +
            'CPF benefits include:\n' +
            '• Full medical care in case of health issues\n' +
            '• Replacement of buffalo in case of critical loss\n' +
            '• Artificial insemination support to ensure the birth of female Murrah calves only\n' +
            '• Continuous health monitoring\n' +
            '• Live CCTV access to monitor your buffaloes in real time\n\n' +
            'CPF safeguards your asset and ensures uninterrupted income generation.',
    },
    {
        question: 'Why do I need to purchase at least 1 unit?',
        answer:
            '1 unit includes:\n' +
            '• 2 Murrah buffaloes\n' +
            '• 2 calves\n\n' +
            'Purchasing 1 full unit is mandatory because:\n' +
            '• It ensures higher and more stable income\n' +
            '• It supports proper milk production cycles\n' +
            '• It enables eligibility for CPF benefits\n' +
            '• It provides long-term profit scalability\n\n' +
            'Purchasing only 1 buffalo + 1 calf does not generate sufficient income or profit and is therefore not supported.',
    },
    {
        question: 'What is Animal Kart?',
        answer:
            'Animal Kart is a digital platform that allows you to purchase units of high-quality livestock and earn returns through professional management.',
    },
    {
        question: 'How do I purchase a unit?',
        answer:
            'Browse the buffalo list, select a breed, choose the number of units, and complete the payment using Online or Manual payment options.',
    },
    {
        question: 'What is CPF?',
        answer:
            'CPF (Cattle Protection Fund) is an protection for your investment, covering risks associated with livestock health.',
    },
    {
        question: 'How does the referral program work?',
        answer:
            'Once you purchase your first unit, your referral feature is unlocked. You can then refer friends by entering their contact details in the "Refer & Earn" section.',
    },
    {
        question: 'What rewards do I get for referrals?',
        answer:
            'You earn coins for every unit your friend purchases (excluding CPF). These coins can be accumulated to unlock more units.',
    },
    {
        question: 'Are the referral rewards cumulative?',
        answer:
            'Yes! If your friend purchases multiple units at once or over time, you receive the 5% reward for each unit they buy.',
    },
    {
        question: 'How can I track my referrals?',
        answer:
            'You can track all your successful referrals and earned coins in the "Refer & Earn" section under "Track my referrals".',
    },
    {
        question: 'What are the payment options?',
        answer:
            'We support Manual payment (Direct Bank Transfer).',

    },
    {
        question: 'Can I sell or transfer my units?',
        answer:
            'Yes, units can be transferred or sold within the platform according to the terms of service after a minimum holding period.',
    },
    {
        question: 'How do I contact support?',
        answer:
            'If you have any issues, you can "Raise a Request" in the HelpDesk, or use our WhatsApp support for quick assistance.',
    },
];

const FAQItem: React.FC<{ item: FAQ }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    const renderContent = (text: string) => {
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];
        let listItems: string[] = [];
        let keyCounter = 0;

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${keyCounter++}`}>
                        {listItems.map((li, idx) => (
                            <li key={idx}>
                                {li.substring(1).trim()}
                            </li>
                        ))}
                    </ul>
                );
                listItems = [];
            }
        };

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('•')) {
                listItems.push(trimmed);
            } else {
                flushList();
                if (trimmed) {
                    elements.push(
                        <p key={`p-${keyCounter++}`}>
                            {trimmed}
                        </p>
                    );
                }
            }
        });
        flushList();

        return elements;
    };

    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            <div className="faq-question">
                <span>{item.question}</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div className={`faq-answer ${isOpen ? 'show' : ''}`}>
                {renderContent(item.answer)}
            </div>
        </div>
    );
};

const Support: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Support form submitted:', formData);
        alert('Thank you for contacting support! We will get back to you shortly.');
        // Reset form
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            message: ''
        });
    };

    return (
        <div className="support-container">
            <div className="support-header">
                <h1>Contact Support</h1>
                <p>We are here to help. Check our FAQs or fill out the form below.</p>
            </div>

            <div className="faq-section">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-list">
                    {FAQS.map((faq, index) => (
                        <FAQItem key={index} item={faq} />
                    ))}
                </div>
            </div>

            <div className="support-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-col">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    className="form-control"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-col">
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    className="form-control"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className="form-control"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">How can we help you?</label>
                        <textarea
                            id="message"
                            name="message"
                            className="form-control"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Describe your issue or question..."
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="submit-btn">Send Message</button>
                </form>
            </div>
        </div>
    );
};

export default Support;
