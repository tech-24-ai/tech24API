"use strict";

const Contact = use("App/Models/Admin/ContactModule/Contact");
const Mail = use("Mail");
const Env = use("Env");
class ContactController {
  async index({ request, response, auth }) {
    // const visitor = await auth.authenticator('visitorAuth').getUser()
    const query = new Contact();
    query.contact_type_id = request.input("contact_type_id");
    query.organisation_name = request.input("organisation_name");
    query.requirement = request.input("requirement");
    query.company_address = request.input("company_address");
    query.website = request.input("website");
    query.domain_expertise = request.input("domain_expertise");
    query.revenue_range = request.input("revenue_range");
    query.number_employees = request.input("number_employees");
    await query.save();

    await this.sendAdminMail(query.id);
    //await this.sendVisitorMail(query.id, visitor)
    return response.status(200).send({ message: "Create successfully" });
  }

  async sendAdminMail(id) {

    const contactResult = await Contact.query()
      .with("contact_type")
      .where("id", id)
      .first();
    const contactData = contactResult.toJSON();
    
    // replace null with empty string
    for (let key in contactData) {
      if (contactData[key]===null) {
        contactData[key]="-"
      }
    }
    
    contactData.contact_type = contactData.contact_type.name;
    const subject = `New Connect Request.`;
    const details = `New Connect Request.`;
    await Mail.send(
      "connectAdminMail",
      { title: subject, details: details, result: contactData },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(Env.get("TO_MAIL_USERNAME"));
      }
    );
  }
  /*async sendVisitorMail(id, visitor) {
        const contactResult = await Contact.query().with('contact_type').where('id', id).first()
        const contactData = contactResult.toJSON()
        contactData.contact_type = contactData.contact_type.name
        const subject = `Thanks ${visitor.name ? visitor.name : ''} for connecting.`
        const details = `Thanks ${visitor.name ? visitor.name : ''} for connecting.`
        await Mail.send('connectAdminMail', { title: subject, details: details, result: contactData }, (message) => {
            message.subject(subject)
            message.from(Env.get('MAIL_USERNAME'))
            message.to(visitor.email)
        })
    }*/
}

module.exports = ContactController;
