const Mail = use("Mail");
const Env = use("Env");

module.exports.sendMail = async function (
  email_to,
  subject,
  attachment,
  fileName,
  title,
  name,
  details
) {
  return await Mail.send(
    "productlistmail",
    {
      title: title,
      name: name,
      details: details,
    },
    (message) => {
      message.subject(subject);
      message.attachData(new Buffer(attachment), fileName);
      message.from(Env.get("MAIL_USERNAME"));
      message.to(email_to);
    }
  );
};
