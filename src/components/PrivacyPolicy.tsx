import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './PrivacyPolicy.css';

const DEFAULT_CONTENT = `
    <h1>Privacy Policy & Terms and Conditions</h1>
    <p>Last Updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. Information We Collect</h2>
    <p>To provide a transparent and reliable platform for buffalo unit investments, we collect the following information:</p>
    <ul>
        <li><strong>Personal Identity Information:</strong> Name, gender, and email address.</li>
        <li><strong>Contact Information:</strong> Registered mobile number used for login and OTP verification.</li>
        <li><strong>Financial & Transaction Data:</strong> Payment details for manual transfers, including UTR numbers, bank names, and IFSC codes. Uploaded images of payment screenshots or cheque copies. Order history and total investment values.</li>
        <li><strong>Referral Data:</strong> Information regarding successful referrals and the accumulation of referral coins.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>Your data is used to facilitate the following business functions:</p>
    <ul>
        <li><strong>Account Management:</strong> To verify your identity via OTP and manage your profile.</li>
        <li><strong>Transaction Processing:</strong> To verify manual payments for buffalo units and provide invoices for "Paid" orders.</li>
        <li><strong>Investment Projections:</strong> To display personalized income projections And Asset Market Value </li>
        <li><strong>Rewards Program:</strong>To calculate and credit the applicable referral reward as coins to your AnimalKart account.</li>
        <li><strong>Communication:</strong> To notify you regarding payment verification outcomes and order status updates.</li>
    </ul>

    <h2>3. Data Storage and Security</h2>
    <ul>
        <li><strong>Secure Storage:</strong> Manual payment data and transaction proofs are stored securely.</li>
        <li><strong>Biometric Security:</strong> Users have the option to enable "App Lock" via fingerprint for local device authentication.</li>
        <li><strong>Admin Access:</strong> Only authorized Admin and Management teams have access to verify payment details and manage business rules.</li>
    </ul>

    <h2>4. Information Sharing and Disclosure</h2>
    <p>We share information only with parties essential to the service:</p>
    <ul>
        <li><strong>CPF Partners:</strong> To facilitate optional CPF (Cattle Protection Fund) coverage for buffalo units.</li>
        <li><strong>Admin/Verification Teams:</strong> To review submitted manual payment details (verification typically takes 3 business days).</li>
        <li><strong>Third-Party Sharing:</strong> When using the "Refer and Earn" feature, your referral link is shared via external apps like WhatsApp, SMS, or Email at your direction.</li>
    </ul>

    <h2>5. Data Retention and User Rights</h2>
    <ul>
        <li><strong>Read-Only Records:</strong> Once an order is confirmed or a payment is verified, transaction details remain read-only to ensure financial integrity.</li>
        <li><strong>Coin Management:</strong> Referral coins cannot be transferred as cash and can only be used within the application for unit purchases once a  coins is reached.</li>
        <li><strong>Account Control:</strong> Users can log out at any time, which redirects them to the login screen.</li>
    </ul>

    <h2>6. Updates to This Policy</h2>
    <p>As the Animal Cart application evolves—potentially adding features like milk sales management or veterinary services—this policy may be updated.</p>

    <h2>7. KYC & Government Identification Data</h2>
    <p>We may collect government-issued identification documents such as Aadhaar Card and PAN Card solely for identity verification (KYC), regulatory compliance, and fraud prevention. Such data is securely stored in encrypted form and accessed only by authorized personnel. We do not collect or store Aadhaar biometric information.</p>

    <h2>8. User Consent</h2>
    <p>By installing, registering, and using the AnimalKart application, users explicitly consent to the collection, storage, processing, and usage of their personal information as described in this Privacy Policy.</p>

    <h2>9. Third-Party Data Sharing</h2>
    <p>We do not sell, rent, or trade user personal data. Information is shared strictly on a need-to-know basis with service partners such as insurance providers and internal verification teams for operational purposes only.</p>

    <h2>10. Data Deletion & Account Removal</h2>
    <p>Users may request account deletion and personal data removal by contacting our support team at support@animalkart.in. Certain financial, transactional, and compliance-related records may be retained as required under applicable Indian laws.</p>

    <h2>11. Risk & Return Disclaimer</h2>
    <p>All investment values, milk production figures, income projections, and asset appreciation details shown in the application are indicative estimates only and do not constitute guaranteed returns.</p>

    <h1 style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">Terms and Conditions</h1>

    <h2>1. Cattle Protection Fund (CPF) & Unit Purchase</h2>
    <ul>
        <li><strong>Mandatory Inclusion:</strong> The Cattle Protection Fund (CPF) is a mandatory requirement for every buffalo unit purchase.</li>
        <li><strong>Unit Composition:</strong> One buffalo unit is strictly defined as consisting of 2 buffaloes and 2 calves.</li>
        <li><strong>Fixed Cost:</strong> The CPF cost per unit is fixed as per current system configurations.</li>
        <li><strong>Total Investment:</strong> The total investment value displayed to the user includes the base buffalo unit price plus the mandatory CPF cost.</li>
        <li><strong>Asset Value Projections:</strong> Asset Market value and Monthly revenue projections provided in the app are estimated over a 10-year period and are intended for informational purposes.</li>
    </ul>

    <h2>2. Referral Program & Coin Conversion</h2>
    <ul>
        <li><strong>Earning Eligibility:</strong> Coins can only be earned through successful referrals where the referred user completes a purchase.</li>
        <li><strong>Reward Rate:</strong> The referrer earns coins based on the total purchase value of the referred user.</li>
        <li><strong>Coin Valuation:</strong> The application operates on a fixed conversion rate where 1 Coin is equal to ₹1.</li>
        <li><strong>Usage Restrictions:</strong> Coins are non-transferable and cannot be withdrawn or converted directly into cash.</li>
    </ul>

    <h2>3. Coin-Based Purchases and Gifting</h2>
    <ul>
        <li><strong>Minimum Balance:</strong> Users are only permitted to purchase a buffalo unit using coins once their balance reaches a minimum of 1 unit  coins.</li>
        <li><strong>Gifting Option:</strong> Once a unit is purchased using accumulated coins, the user has the specific right to gift that unit to another person.</li>
        <li><strong>Validation:</strong> The system will only enable the coin-purchase option once the sufficient balance condition is met.</li>
    </ul>

    <h2>4. Payment and Verification</h2>
    <ul>
        <li><strong>Manual Payments:</strong> All manual payments (Bank Transfer or Cheque) require verification by the Admin Team before the order status changes from "Pending" to "Paid".</li>
        <li><strong>Verification Timeline:</strong> The admin team aims to complete payment reviews within 3 business days.</li>
        <li><strong>Invoicing:</strong> Official invoices are only generated and made available for download after an order has been successfully marked as "Paid".</li>
    </ul>
`;

const PrivacyPolicy: React.FC = () => {
    const [content, setContent] = useState<string>(() => {
        return localStorage.getItem('privacy_policy_content_v1') || DEFAULT_CONTENT;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editContent, setEditContent] = useState(content);

    useEffect(() => {
        const sessionStr = localStorage.getItem('ak_dashboard_session');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                if (session.role === 'Admin') {
                    setIsAdmin(true);
                }
            } catch (e) {
                console.error('Error parsing session', e);
            }
        }
    }, []);

    const handleEdit = () => {
        setEditContent(content);
        setIsEditing(true);
    };

    const handleSave = () => {
        setContent(editContent);
        localStorage.setItem('privacy_policy_content_v1', editContent);
        setIsEditing(false);
        alert('Privacy Policy updated successfully!');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditContent(content);
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];

    return (
        <div className="privacy-container">
            {isAdmin && !isEditing && (
                <div className="edit-button-container">
                    <button onClick={handleEdit} className="edit-btn"> Edit Policy</button>
                </div>
            )}

            {isEditing ? (
                <>
                    <div className="editor-controls">
                        <button onClick={handleSave} className="save-btn">Save Changes</button>
                        <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                    </div>
                    <ReactQuill
                        theme="snow"
                        value={editContent}
                        onChange={setEditContent}
                        modules={modules}
                        formats={formats}
                        className="privacy-editor"
                    />
                </>
            ) : (
                <div className="privacy-content ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
            )}
        </div>
    );
};


export default PrivacyPolicy;

