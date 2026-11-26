import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using Subspens to track subscriptions online.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16 text-ink space-y-8">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-xs font-semibold text-ledger hover:underline flex items-center gap-1"
        >
          ← Back to Subspens Home
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-xs text-ink/50">Last updated: 26 November 2026</p>
        <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
          Please read these terms and conditions carefully before using Our
          Service.
        </p>
      </div>

      <div className="prose prose-stone max-w-none space-y-6 text-sm sm:text-base text-ink/80 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            1. Interpretation and Definitions
          </h2>
          <h3 className="font-display text-base font-semibold text-ink">
            Interpretation
          </h3>
          <p>
            The words whose initial letters are capitalised have meanings
            defined under the following conditions. The following definitions
            shall have the same meaning regardless of whether they appear in
            singular or in plural.
          </p>
          <h3 className="font-display text-base font-semibold text-ink">
            Definitions
          </h3>
          <p>For the purposes of these Terms and Conditions:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account</strong> means a unique account created for You to
              access our Service or parts of our Service.
            </li>
            <li>
              <strong>Affiliate</strong> means an entity that controls, is
              controlled by, or is under common control with a party, where
              &ldquo;control&rdquo; means ownership of 50% or more of the
              shares, equity interest or other securities entitled to vote for
              election of directors or other managing authority.
            </li>
            <li>
              <strong>Country</strong> refers to Maharashtra, India.
            </li>
            <li>
              <strong>Company</strong> (referred to as either &ldquo;the
              Company&rdquo;, &ldquo;We&rdquo;, &ldquo;Us&rdquo; or
              &ldquo;Our&rdquo; in these Terms and Conditions) refers to
              subspens.com, Unique Youtopia, Kharadi, Pune, Maharashtra 411014.
            </li>
            <li>
              <strong>Device</strong> means any device that can access the
              Service such as a computer, a cell phone or a digital tablet.
            </li>
            <li>
              <strong>Feedback</strong> means feedback, innovations or
              suggestions sent by You regarding the attributes, performance or
              features of our Service.
            </li>
            <li>
              <strong>Subscription Data</strong> means any information You input
              or upload regarding Your personal subscriptions, including but not
              limited to service names, billing amounts, billing cycles, and
              renewal dates, for the purpose of tracking and receiving
              reminders. For clarity, the Company does not process or collect
              payment card or financial account information through the Service,
              and no payments are made to, or through, the Service.
            </li>
            <li>
              <strong>Service</strong> refers to the Website.
            </li>
            <li>
              <strong>Terms and Conditions</strong> (also referred to as
              &ldquo;Terms&rdquo;) means these Terms and Conditions, which
              govern Your access to and use of the Service and form the entire
              agreement between You and the Company regarding the Service.
            </li>
            <li>
              <strong>Third-Party Social Media Service</strong> means any
              services or content (including data, information, products or
              services) provided by a third party that is displayed, included,
              made available, or linked to through the Service.
            </li>
            <li>
              <strong>Website</strong> refers to subspens.com, accessible from{" "}
              <a
                href="https://subspens.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ledger hover:underline"
              >
                https://subspens.com/
              </a>
            </li>
            <li>
              <strong>You</strong> means the individual accessing or using the
              Service, or the company, or other legal entity on behalf of which
              such individual is accessing or using the Service, as applicable.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            2. Acknowledgement
          </h2>
          <p>
            These are the Terms and Conditions governing the use of this Service
            and the agreement between You and the Company. These Terms and
            Conditions set out the rights and obligations of all users regarding
            the use of the Service.
          </p>
          <p>
            Your access to and use of the Service is conditioned on Your
            acceptance of and compliance with these Terms and Conditions. These
            Terms and Conditions apply to all visitors, users and others who
            access or use the Service.
          </p>
          <p>
            By accessing or using the Service You agree to be bound by these
            Terms and Conditions. If You disagree with any part of these Terms
            and Conditions then You may not access the Service.
          </p>
          <p>
            You represent that you are over the age of 18. The Company does not
            permit those under 18 to create an Account or use the Service.
          </p>
          <p>
            Your access to and use of the Service is also subject to Our{" "}
            <Link href="/privacy-policy" className="text-ledger hover:underline">
              Privacy Policy
            </Link>
            , which describes how We collect, use, and disclose personal
            information, including Subscription Data. Please read Our Privacy
            Policy carefully before using Our Service.
          </p>
          <p>
            The Service is free to use. We do not charge any fees, and no
            payments are made by You to the Company through the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            3. Accounts
          </h2>
          <p>
            When You create an Account with Us, You must provide accurate,
            complete and current information at all times. Failure to do so
            constitutes a breach of these Terms, which may result in immediate
            termination of Your Account.
          </p>
          <p>
            You are responsible for safeguarding the password You use to access
            the Service and for any activities or actions under Your password.
            You agree not to disclose Your password to any third party. You must
            notify Us immediately upon becoming aware of any breach of security
            or unauthorised use of Your Account.
          </p>
          <p>
            You are solely responsible for the accuracy of all Subscription Data
            You enter into the Service, including renewal dates, billing cycles
            and billing amounts. We are not responsible for any missed
            cancellations, unwanted renewals, or financial loss arising from
            incorrect, outdated, or incomplete Subscription Data entered by You.
            The Service does not connect to, monitor, or have access to Your
            actual bank accounts, payment cards, or the third-party services You
            track, and relies entirely on the information You manually provide.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            4. Reminder Emails and Service Availability
          </h2>
          <p>
            The Service sends email reminders based on the renewal dates You
            provide in Your Subscription Data. While We take reasonable steps to
            deliver these reminders on time:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              We do not guarantee delivery, timing, or receipt of any reminder
              email. Emails may be delayed, filtered as spam, blocked by Your
              email provider, or otherwise fail to reach You for reasons outside
              Our control.
            </li>
            <li>
              You remain solely responsible for tracking and managing Your own
              subscriptions and cancellation deadlines. The Service is a
              convenience tool and not a substitute for Your own diligence.
            </li>
            <li>
              We are not liable for any charges, renewal fees, or financial
              consequences resulting from a reminder email not being sent,
              delayed, or not received, or resulting from inaccurate
              Subscription Data entered by You.
            </li>
          </ul>
          <p>
            We recommend You do not rely exclusively on the Service for
            time-sensitive cancellation decisions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            5. Intellectual Property
          </h2>
          <p>
            The Service and its original content (excluding Content provided by
            You or other users), features and functionality are and will remain
            the exclusive property of the Company and its licensors.
          </p>
          <p>
            The Service is protected by copyright, trademark, and other laws of
            both the Country and foreign countries.
          </p>
          <p>
            Our trademarks and trade dress may not be used in connection with
            any product or service without the prior written consent of the
            Company.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            6. Your Feedback to Us
          </h2>
          <p>
            You assign all rights, title and interest in any Feedback You
            provide the Company. If for any reason such assignment is
            ineffective, You agree to grant the Company a non-exclusive,
            perpetual, irrevocable, royalty free, worldwide right and licence to
            use, reproduce, disclose, sub-license, distribute, modify and exploit
            such Feedback without restriction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            7. Links to Other Websites
          </h2>
          <p>
            Our Service may contain links to third-party websites or services
            that are not owned or controlled by the Company.
          </p>
          <p>
            The Company has no control over, and assumes no responsibility for,
            the content, privacy policies, or practices of any third-party
            websites or services. You further acknowledge and agree that the
            Company shall not be responsible or liable, directly or indirectly,
            for any damage or loss caused or alleged to be caused by or in
            connection with the use of or reliance on any such content, goods or
            services available on or through any such websites or services.
          </p>
          <p>
            We strongly advise You to read the terms and conditions and privacy
            policies of any third-party websites or services that You visit.
          </p>
          <h3 className="font-display text-base font-semibold text-ink">
            7.1 Links from a Third-Party Social Media Service
          </h3>
          <p>
            The Service may display, include, make available, or link to content
            or services provided by a Third-Party Social Media Service. A
            Third-Party Social Media Service is not owned or controlled by the
            Company, and the Company does not endorse or assume responsibility
            for any Third-Party Social Media Service.
          </p>
          <p>
            You acknowledge and agree that the Company shall not be responsible
            or liable, directly or indirectly, for any damage or loss caused or
            alleged to be caused by or in connection with Your access to or use
            of any Third-Party Social Media Service, including any content,
            goods, or services made available through them. Your use of any
            Third-Party Social Media Service is governed by that Third-Party
            Social Media Service&apos;s own terms and privacy policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            8. Prohibited Uses
          </h2>
          <p>
            You may use the Service only for lawful purposes and in accordance
            with these Terms. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Use the Service in any way that breaches any applicable local,
              national or international law or regulation.
            </li>
            <li>
              Send, or arrange the sending of, spam or any other unsolicited
              advertising or promotional material through the Service.
            </li>
            <li>
              Use any robot, spider, scraper or other automated means to access
              the Service, or to collect content or data from it, without Our
              prior written permission.
            </li>
            <li>
              Reverse engineer, decompile, disassemble or otherwise attempt to
              derive the source code of the Service or of any software that
              forms part of it, except to the extent that applicable law
              expressly permits it.
            </li>
            <li>
              Attempt to gain unauthorised access to, interfere with, damage or
              disrupt any part of the Service, the servers on which it is
              stored, or any connected server, computer or database, or
              circumvent any security or access-control measure of the Service.
            </li>
            <li>
              Overload the Service, including through a denial-of-service
              attack.
            </li>
            <li>
              Introduce viruses, trojan horses, worms, logic bombs or other
              material that is malicious or technologically harmful.
            </li>
            <li>
              Impersonate or attempt to impersonate the Company, an employee of
              the Company, another user, or any other person or entity,
              including creating an Account using another person&apos;s identity
              without authorisation.
            </li>
            <li>
              Harass, abuse, threaten or harm another person through the
              Service.
            </li>
            <li>
              Copy, resell or sublicense access to the Service, or use the
              Service to build a competing product or service, without Our prior
              written permission.
            </li>
          </ul>
          <p>
            If You breach this section, We may suspend or terminate Your Account
            and access to the Service, remove any content involved, and report
            the breach to the relevant law enforcement authorities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            9. Termination
          </h2>
          <p>
            We may terminate or suspend Your Account and access immediately,
            without prior notice or liability, for any reason whatsoever,
            including without limitation if You breach these Terms and
            Conditions.
          </p>
          <p>
            You may delete Your Account at any time through Your account
            settings, or by contacting Us at{" "}
            <code className="text-xs bg-paper/60 px-1.5 py-0.5 rounded border border-line">
              support@subspens.com
            </code>
            . Upon deletion, Your Subscription Data will be removed in
            accordance with Our{" "}
            <Link href="/privacy-policy" className="text-ledger hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            Upon termination, Your right to use the Service will cease
            immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            10. Limitation of Liability
          </h2>
          <p>
            As the Service is provided free of charge and no payments are made
            by You through the Service, to the maximum extent permitted by
            applicable law, the Company and its suppliers shall not be liable to
            You for any damages whatsoever arising out of or in connection with
            Your use of, or inability to use, the Service.
          </p>
          <p>
            Without limiting the foregoing, in no event shall the Company or its
            suppliers be liable for any special, incidental, indirect, or
            consequential damages — including but not limited to damages for
            loss of profits, loss of data, missed subscription cancellations,
            unwanted renewal charges by third parties, business interruption, or
            personal injury — arising out of or in any way related to the use of
            or inability to use the Service, even if the Company has been
            advised of the possibility of such damages.
          </p>
          <p>
            Some states or jurisdictions do not allow the exclusion of implied
            warranties or limitation of liability for incidental or
            consequential damages, which means that some of the above
            limitations may not apply. In these jurisdictions, each party&apos;s
            liability will be limited to the greatest extent permitted by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            11. &ldquo;As Is&rdquo; and &ldquo;As Available&rdquo; Disclaimer
          </h2>
          <p>
            The Service is provided to You &ldquo;AS IS&rdquo; and &ldquo;AS
            AVAILABLE&rdquo; and with all faults and defects without warranty of
            any kind. The Company expressly disclaims all warranties, whether
            express, implied, statutory or otherwise, with respect to the
            Service, including all implied warranties of merchantability,
            fitness for a particular purpose, title and non-infringement.
          </p>
          <p>
            Without limitation to the foregoing, the Company makes no
            representation or warranty that the Service, including its reminder
            email functionality, will be uninterrupted, timely, error-free, or
            that any errors or defects can or will be corrected.
          </p>
          <p>
            Some jurisdictions do not allow the exclusion of certain types of
            warranties, so some or all of the above exclusions may not apply to
            You. In such cases, the exclusions set forth in this section shall
            be applied to the greatest extent enforceable under applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            12. For European Union (EU) Users
          </h2>
          <p>
            If You are a European Union consumer, You will benefit from any
            mandatory provisions of the law of the country in which You are
            resident, notwithstanding the Governing Law clause below. This
            includes rights under the General Data Protection Regulation (GDPR)
            regarding Your personal data and Subscription Data, as further
            described in Our{" "}
            <Link href="/privacy-policy" className="text-ledger hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            13. United States Legal Compliance
          </h2>
          <p>
            You represent and warrant that (i) You are not located in a country
            that is subject to a United States government embargo, or that has
            been designated by the United States government as a
            &ldquo;terrorist supporting&rdquo; country, and (ii) You are not
            listed on any United States government list of prohibited or
            restricted parties.
          </p>
          <p>
            If You are a California resident, You may have additional rights
            under the California Consumer Privacy Act (CCPA) regarding Your
            personal information, as described in Our{" "}
            <Link href="/privacy-policy" className="text-ledger hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            14. International Use
          </h2>
          <p>
            The Service is accessible globally. We make no representation that
            the Service is appropriate or available for use in every country or
            jurisdiction. If You access the Service from outside India, You do
            so on Your own initiative and are responsible for compliance with
            local laws, including any laws regarding the import, export, or use
            of the Service, and any data protection laws applicable to You.
          </p>
          <p>
            Billing amounts and currency entered or displayed in the Service are
            based solely on information You provide and are for Your personal
            tracking purposes only. The Company does not verify, convert, or
            guarantee the accuracy of any such amounts, and is not responsible
            for any discrepancy between the amount displayed in the Service and
            the amount actually charged to You by any third party.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            15. Governing Law
          </h2>
          <p>
            The laws of the Country (Maharashtra, India), excluding its
            conflicts of law rules, shall govern these Terms and Your use of the
            Service. This does not override any mandatory consumer protection
            rights You may have under the law of Your country of residence,
            where such rights cannot be waived by agreement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            16. Disputes Resolution
          </h2>
          <p>
            If You have any concern or dispute about the Service, You agree to
            first try to resolve the dispute informally by contacting the
            Company at{" "}
            <code className="text-xs bg-paper/60 px-1.5 py-0.5 rounded border border-line">
              support@subspens.com
            </code>
            .
          </p>
          <h3 className="font-display text-base font-semibold text-ink">
            16.1 Courts
          </h3>
          <p>
            If a dispute is not resolved informally, the courts of Pune,
            Maharashtra, India shall have exclusive jurisdiction over any
            dispute arising out of or relating to these Terms or the Service. If
            You are a consumer, this does not take away any right You have under
            the law of the country where You live to bring a claim in its
            courts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            17. Severability and Waiver
          </h2>
          <h3 className="font-display text-base font-semibold text-ink">
            17.1 Severability
          </h3>
          <p>
            If any provision of these Terms is held to be unenforceable or
            invalid, such provision will be changed and interpreted to
            accomplish the objectives of such provision to the greatest extent
            possible under applicable law, and the remaining provisions will
            continue in full force and effect.
          </p>
          <h3 className="font-display text-base font-semibold text-ink">
            17.2 Waiver
          </h3>
          <p>
            Except as provided herein, the failure to exercise a right or to
            require performance of an obligation under these Terms shall not
            affect a party&apos;s ability to exercise such right or require such
            performance at any time thereafter, nor shall the waiver of a breach
            constitute a waiver of any subsequent breach.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            18. Translation Interpretation
          </h2>
          <p>
            These Terms and Conditions may have been translated if We have made
            them available to You on our Service. You agree that the original
            English text shall prevail in the case of a dispute.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            19. Changes to These Terms and Conditions
          </h2>
          <p>
            We reserve the right, at Our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, We will make
            reasonable efforts to provide at least 30 days&apos; notice prior to
            any new terms taking effect.
          </p>
          <p>
            By continuing to access or use Our Service after those revisions
            become effective, You agree to be bound by the revised terms. If You
            do not agree to the new terms, please stop using the Service, and
            You may delete Your Account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            20. Contact Us
          </h2>
          <p>
            If you have any questions about these Terms and Conditions, You can
            contact us:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              By email:{" "}
              <code className="text-xs bg-paper/60 px-1.5 py-0.5 rounded border border-line">
                support@subspens.com
              </code>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
