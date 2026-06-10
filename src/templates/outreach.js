export default function generateTemplate(data) {
  const { firstName, company, seedDomain, senderName } = data;

  const subject = `Question about ${company}`;
  
  const textBody = `Hi ${firstName},

I noticed ${company} operates in a similar space to ${seedDomain} and I was wondering if you are facing similar scaling challenges.

We've helped companies in your exact space improve their operations. Would you be open to a quick chat next week?

Best regards,
${senderName}`;

  const htmlBody = `
    <p>Hi ${firstName},</p>
    <p>I noticed <strong>${company}</strong> operates in a similar space to <strong>${seedDomain}</strong> and I was wondering if you are facing similar scaling challenges.</p>
    <p>We've helped companies in your exact space improve their operations. Would you be open to a quick chat next week?</p>
    <br/>
    <p>Best regards,<br/><strong>${senderName}</strong></p>
  `;

  return { subject, textBody, htmlBody };
}
