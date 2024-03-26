'use strict'
const Investor = use('App/Models/Investor')
const Subscription = use('App/Models/Subcription')

class MIDashboardController {

    async index({ response }) {
        let data = []
        data.push({
            name: 'Total Investor',
            icon: 'people',
            color: 'primary',
            value: await Investor.query().whereRaw('is_company = 0 and status = 1').getCount()
        })
        data.push({
            name: 'Total Company Users',
            icon: 'groups',
            color: 'success',
            value: await Investor.query().whereRaw('is_company = 1 and status = 1').getCount()
        })
        data.push({
            name: 'Pending for Approval',
            icon: 'approval',
            color: 'warning',
            value: await Investor.query().where('status', 0).getCount()
        })
        data.push({
            name: 'Total Subscribed Investors/Company Users',
            icon: 'attach_money',
            color: 'success',
            value: await Subscription.query().where('is_active',1).groupBy('user_id').getCount()
        })
        return response.status(200).send({ data })
    }
}

module.exports = MIDashboardController
