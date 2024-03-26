'use strict'

const InvestorFilter = use("App/Models/InvestorFilter");

class InvestorFilterController {

    async store({ request, response }) {
        const deleteQuery = await InvestorFilter.findBy('investor_id', request.input('investor_id'))
        await deleteQuery.delete()

        const query = new InvestorFilter()
        query.investor_id = request.input('investor_id')
        query.text = request.input('text')

        await query.save()
        return response.status(200).send({ message: 'Create successfully' })

    }

    async show({ params, response }) {
        const query = InvestorFilter.query();
        query.where("investor_id", params.id);
        const result = await query.firstOrFail();
        return response.status(200).send(result);
    }
}

module.exports = InvestorFilterController
