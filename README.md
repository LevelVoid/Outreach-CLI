# Subspace Outreach Pipeline

An automated cold outreach CLI tool that integrates with Ocean.io, Prospeo, and Brevo SMTP to find lookalike companies, extract decision-maker contact info, and send personalized cold emails.

## Prerequisites

- Node.js (v20.0.0 or higher)
- API Keys for:
  - Ocean.io
  - Prospeo
  - Brevo (SMTP credentials)

## Installation

1. Clone the repository and navigate into the project directory.
2. Install the dependencies:

```bash
npm install
```

3. Setup your environment variables:

```bash
cp .env.example .env
```

Open the `.env` file and fill in your actual API keys, SMTP credentials, and Sender details.

## Usage

The CLI requires a seed domain to search for lookalike companies.

### Basic Run

To run the pipeline and send emails:

```bash
node src/index.js example.com
```

### Dry Run (Recommended for Testing)

To see the pipeline in action without actually sending any emails, use the `--dry-run` flag. This will print the generated email subject and body to your terminal instead.

```bash
node src/index.js example.com --dry-run
```

### Test Email

To execute a full pipeline run but redirect all generated emails to a specific test inbox (instead of the actual decision makers), use the `--test-email` flag. This will only send 1 email and then gracefully exit.

```bash
node src/index.js example.com --test-email your-email@domain.com
```

## Available Flags

You can customize the pipeline behavior using the following flags:

- `--max-companies <n>`: Maximum number of lookalike companies to fetch from Ocean.io (default: 10)
- `--contacts-per-company <n>`: Maximum decision-makers to target per company (default: 2)
- `--titles <csv>`: Comma-separated list of job titles to target (default: CEO,CTO,CFO,COO,VP,Director)
- `--template <name>`: The name of the Javascript template file inside the `src/templates/` directory to use for email generation. Do not include the `.js` extension.
- `--email-delay <ms>`: Delay between sending emails in milliseconds to respect SMTP limits (default: 1000)
- `--test-email <email>`: Send a test email to this address during a dry run.
- `--dry-run`: Run all stages but skip sending emails.
- `--help`: Show the help menu.

## Examples

Fetch up to 25 lookalike companies, targeting 5 contacts per company:

```bash
node src/index.js stripe.com --max-companies 25 --contacts-per-company 5
```

Target specific job titles only:

```bash
node src/index.js stripe.com --titles "CEO,Founder,Owner"
```

Use a custom email template named `src/templates/follow_up.js`:

```bash
node src/index.js stripe.com --template follow_up
```

## Templates

To create custom email templates, add a new `.js` file to the `src/templates/` directory.

The file must export a default function that takes a data object and returns an object containing `subject`, `textBody`, and `htmlBody`.

Example template format (`src/templates/example.js`):

```javascript
export default function generateTemplate(data) {
  const { firstName, company, seedDomain, senderName } = data;

  return {
    subject: `Thoughts on ${company}`,
    textBody: `Hi ${firstName},\n\nWould love to chat about ${seedDomain}.`,
    htmlBody: `<p>Hi ${firstName},</p><p>Would love to chat about ${seedDomain}.</p>`
  };
}
```
