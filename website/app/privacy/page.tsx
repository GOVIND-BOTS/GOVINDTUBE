import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | GOVIND TUBE",
  description: "How GOVIND TUBE handles account, video and app information.",
};

export default function PrivacyPolicy() {
  return (
    <main className="legalPage">
      <Link href="/" className="legalBrand">GOVIND <b>TUBE</b></Link>
      <p className="legalEyebrow">YOUR PRIVACY MATTERS</p>
      <h1>Privacy Policy</h1>
      <p className="legalUpdated">Last updated: 25 November 2026</p>
      <p>GOVIND TUBE is a video-sharing service that lets people create accounts, publish videos and discover content. This page describes the information the current application is designed to process. The operator must review and complete this policy with verified business and contact details before public launch or Play Store submission.</p>
      <h2>Information we process</h2>
      <ul>
        <li><b>Account information:</b> name, email address and a securely hashed password when you register.</li>
        <li><b>Creator information:</b> channel name, public username and optional biography.</li>
        <li><b>Content:</b> videos, titles and descriptions you choose to upload.</li>
        <li><b>Service information:</b> video view counts and basic technical request information required to operate and protect the service.</li>
      </ul>
      <h2>How information is used</h2>
      <p>Information is used to authenticate accounts, display creator channels, store and stream published videos, operate search and maintain service security. Public channel details and published videos may be visible to anyone using GOVIND TUBE.</p>
      <h2>Storage and security</h2>
      <p>Passwords are stored as password hashes, not as readable passwords. Authentication uses access tokens. The current development implementation stores uploaded media on the backend server's local disk. Before public production release, the operator must configure secured production hosting, private media storage, HTTPS, backups, access controls and a retention process.</p>
      <h2>Sharing</h2>
      <p>We do not describe or promise any advertising or analytics partner integrations in this development release. Published videos and public channel information are intended to be viewable by other users. Infrastructure providers may process information as needed to host and deliver the service; the operator must list the actual providers before launch.</p>
      <h2>Your choices and account deletion</h2>
      <p>You can choose what content to upload. Account export, in-app account deletion and a complete content deletion workflow are not yet implemented in this development build. These controls and a verified support contact must be available before the app is released publicly through Google Play.</p>
      <h2>Children</h2>
      <p>GOVIND TUBE is not currently designed or approved as a service for children. The operator must establish an age policy, safety controls and any required parental-consent process before launch.</p>
      <h2>Policy changes and contact</h2>
      <p>This is a development policy draft, not a final legal document. Before launch, replace this notice with the operator's legal identity, working privacy contact, actual hosting and processing providers, retention periods, jurisdiction-specific rights and final account-deletion instructions.</p>
      <p><Link href="/">Return to GOVIND TUBE</Link></p>
    </main>
  );
}
