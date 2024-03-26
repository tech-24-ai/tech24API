'use strict'

const Contact = use('App/Models/MI/MiContact')
const Mail = use('Mail')
const geoip = require("geoip-lite");
const _ = require("lodash");
const Env = use('Env')

class MiContactController {
    
    async index({ request, response, auth }) {

        const investor = await auth.authenticator('investorAuth').getUser();
        const query = new Contact();
                
        
        query.email = investor.email;
        query.mobile = investor.mobile;
        query.name = investor.name;
        query.investor_id = investor.id;
        query.message = request.input('message');

       const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
        let guest_ip = _.trim(_.first(ipAddress));
        guest_ip =
            guest_ip && guest_ip != ""
            ? guest_ip
            : request.request.socket.remoteAddress;
        let geo = geoip.lookup(guest_ip);

        query.ip = guest_ip;
        query.country = geo ? geo.country : "";
        query.city = geo ? geo.city : "";

        await query.save()

        await this.sendAdminMail(query.id)
        
        return response.status(200).send({ message: 'Create successfully' })
    }


    async guest({ request, response}) {

        const query = new Contact();
        
        query.email = request.input('email');
        query.mobile = request.input('mobile');
        query.name = request.input('name');
        query.investor_id = 0;
        query.message = request.input('message');

       const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
        let guest_ip = _.trim(_.first(ipAddress));
        guest_ip =
            guest_ip && guest_ip != ""
            ? guest_ip
            : request.request.socket.remoteAddress;
        let geo = geoip.lookup(guest_ip);

        query.ip = guest_ip;
        query.country = geo ? geo.country : "";
        query.city = geo ? geo.city : "";

        await query.save()

        await this.sendAdminMail(query.id)
        
        return response.status(200).send({ message: 'Create successfully'})
    }


    async sendAdminMail(id) {

        const contactResult = await Contact.query().with('investors').where('id', id).first()
        const contactData = contactResult.toJSON()
        const subject = 'New Message Received from Market Intelligence section'
        const details = 'Contact Details'
        await Mail.send('miconnectAdminMail', { title: subject, details: details, result: contactData }, (message) => {
            message.subject(subject)
            message.from(Env.get('MAIL_USERNAME'))
            message.to(Env.get('TO_MAIL_USERNAME'))
        })
    }

}

module.exports = MiContactController
