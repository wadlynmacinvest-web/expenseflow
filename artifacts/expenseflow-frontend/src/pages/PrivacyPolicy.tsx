import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to ExpenseFlow
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>

        <p className="mb-8 text-sm text-slate-500">
          Last updated: September 14, 2026
        </p>

        <div className="space-y-7 leading-7">

          <section>
            <h2 className="mb-2 text-xl font-semibold">1. Introduction</h2>
            <p>
              ExpenseFlow is a personal finance and expense tracking
              application designed to help users manage and organize their
              financial information. This Privacy Policy explains what
              information ExpenseFlow collects, how it is used, how it is
              stored, and the choices available to users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              2. Information We Collect
            </h2>

            <p>
              When you create and use an ExpenseFlow account, we may collect
              information that you voluntarily provide, including:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Full name</li>
              <li>Email address</li>
              <li>Account password</li>
              <li>Monthly budget information</li>
            </ul>

            <p className="mt-4">
              Your password is processed using password hashing technology
              before being stored. ExpenseFlow does not store your password in
              plain text.
            </p>

            <p className="mt-4">
              When you use the financial management features, you may also
              provide:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Expense titles and descriptions</li>
              <li>Expense amounts</li>
              <li>Expense categories</li>
              <li>Expense dates</li>
              <li>Transaction type, including revenue or expense</li>
              <li>Transaction titles, amounts, categories and notes</li>
              <li>Transaction dates</li>
              <li>Payable and receivable information</li>
              <li>Names of counterparties associated with ledger entries</li>
              <li>Amounts, due dates, statuses and notes relating to ledger entries</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              3. How We Use Your Information
            </h2>

            <p>
              We use information collected through ExpenseFlow to provide and
              operate the application's features, including:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Creating and managing your account</li>
              <li>Authenticating your account</li>
              <li>Recording and displaying your financial information</li>
              <li>Calculating expense and transaction summaries</li>
              <li>Managing budgets and financial records</li>
              <li>Maintaining and improving the application</li>
              <li>Protecting the security and integrity of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              4. Authentication and Local Storage
            </h2>

            <p>
              ExpenseFlow uses authentication tokens to keep users signed in.
              The application stores authentication information locally on the
              user's device or browser and sends the authentication token to
              the ExpenseFlow server when authenticated requests are made.
            </p>

            <p className="mt-4">
              Users should protect access to their device and account
              credentials and should not share their login information with
              others.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              5. Data Storage and Service Providers
            </h2>

            <p>
              ExpenseFlow uses third-party infrastructure and service providers
              to operate the application, including application hosting,
              database infrastructure and related technical services.
            </p>

            <p className="mt-4">
              Information submitted through ExpenseFlow may therefore be
              processed or stored by these service providers as necessary to
              provide the application.
            </p>

            <p className="mt-4">
              ExpenseFlow takes reasonable measures designed to protect user
              information against unauthorized access, alteration, disclosure
              or destruction. However, no method of electronic transmission or
              storage can be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              6. Financial Information
            </h2>

            <p>
              ExpenseFlow is designed to help users record and manage their
              own financial information. Users should only enter information
              that they are authorized to provide.
            </p>

            <p className="mt-4">
              ExpenseFlow does not require users to provide bank account
              credentials or payment-card credentials in order to use the
              core expense tracking features.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              7. Information Sharing
            </h2>

            <p>
              Your financial records are associated with your account and are
              not intended to be publicly displayed.
            </p>

            <p className="mt-4">
              Information may be processed by service providers that help
              operate ExpenseFlow, or disclosed when reasonably necessary to
              comply with applicable law, legal processes, protect the rights
              or safety of users, prevent abuse, or protect the security of the
              service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              8. Data Retention and Deletion
            </h2>

            <p>
              Account and financial information may be retained for as long as
              necessary to provide the service and maintain the application,
              subject to applicable legal and operational requirements.
            </p>

            <p className="mt-4">
              ExpenseFlow provides functionality that allows users to delete
              individual financial records such as expenses, transactions and
              ledger entries.
            </p>

            <p className="mt-4">
              If you want to request deletion of your account or personal
              information, please contact the ExpenseFlow support team using
              the contact information provided with the application.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              9. Children's Privacy
            </h2>

            <p>
              ExpenseFlow is not intended for children who are below the
              minimum age at which they can lawfully provide consent to the
              processing of their personal information. We do not knowingly
              collect personal information from children without appropriate
              consent.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              10. Changes to This Privacy Policy
            </h2>

            <p>
              We may update this Privacy Policy from time to time. When
              material changes are made, the updated policy will be made
              available through ExpenseFlow and the "Last updated" date will
              be revised.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              11. Contact Us
            </h2>

            <p>
              If you have questions, concerns or requests regarding this
              Privacy Policy or the handling of your information, please
              contact the ExpenseFlow support team at{" "}
              <a
                href="mailto:expenseflowgate@gmail.com"
                className="font-medium text-blue-600 hover:underline"
              >
                expenseflowgate@gmail.com
              </a>
              .
            </p>
          </section>

        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-slate-500">
          © 2026 ExpenseFlow. All rights reserved.
        </div>
      </div>
    </div>
  );
}
