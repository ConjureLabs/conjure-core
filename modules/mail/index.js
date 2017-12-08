const config = require('../config');
const { ContentError } = require('../err');

module.exports.send = ({ to, subject, text, html }) => {
  const postmark = require('postmark');
  const client = new postmark.Client(config.postmark.key);

  if (!to) {
    throw new ContentError(`mail.send requires 'to'`);
  }
  if (!subject) {
    throw new ContentError(`mail.send requires 'subject'`);
  }
  if (!(typeof html === 'string') || !(typeof text === 'string')) {
    throw new ContentError(`mail.send requires either 'html' or 'text' content`);
  }

  const emailContent = typeof html === 'string' ? html : `<body>${text}</body>`;

  client.sendEmail({
    From: 'info@conjure.sh',
    To: to,
    Subject: subject,
    HtmlBody: emailContent
  });
};
