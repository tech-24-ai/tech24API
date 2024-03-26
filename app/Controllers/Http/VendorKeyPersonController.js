'use strict'

const VendorKeyPerson = use("App/Models/Admin/VendorModule/VendorKeyPeoples");

const Query = use('Query')
const moment = require("moment");

const searchInFields = [
    'name',
    'designation',
    'twitter_link',
    'linkedin_link',
    'instagram_link',
]

class VendorKeyPersonController {
    async index({ request, response }) {

        const query = VendorKeyPerson.query()
        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })

        if (orderBy && orderDirection) {
            query.orderBy(`${orderBy}`, orderDirection)
        }

        if (search) {
            query.where(searchQuery.search(searchInFields))
        }

        if (request.input('vendor_id')) {
            query.where('vendor_id', request.input('vendor_id'))
        }
        if (request.input('is_executive_managment')) {
            query.where('is_executive_managment', request.input('is_executive_managment'))
        }
        if (request.input('is_board_of_directors')) {
            query.where('is_board_of_directors', request.input('is_board_of_directors'))
        }

        if (request.input('filters')) {
            const filters = JSON.parse(request.input('filters'))
            filters.forEach(filter => {
                switch (filter.name) {
                    case 'created_at':
                        query.whereRaw(               typeof filter.value == "object"                 ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`                 : `DATE(${filter.name}) = '${moment(filter.value).format(                     "YYYY-MM-DD"                   )}'`             );
                        break;
                    case 'updated_at':
                        query.whereRaw(               typeof filter.value == "object"                 ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`                 : `DATE(${filter.name}) = '${moment(filter.value).format(                     "YYYY-MM-DD"                   )}'`             );
                        break;
                    default:
                        query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`)
                        break;
                }
            })
        }

        if (request.input('start_date') && request.input('end_date')) {
            query.whereRaw(`DATE(created_at) >= '${request.input('start_date')}'`)
            query.whereRaw(`DATE(created_at) <= '${request.input('end_date')}'`)
        }

        let page = null;
        let pageSize = null;

        if (request.input('page')) {
            page = request.input('page')
        }
        if (request.input('pageSize')) {
            pageSize = request.input('pageSize')
        }

        var result
        if (page && pageSize) {
            result = await query.paginate(page, pageSize)
        } else {
            result = await query.fetch()
        }

        return response.status(200).send(result)
    }

    async store({ request, response }) {
        const query = new VendorKeyPerson()

        query.vendor_id = request.input('vendor_id')
        query.name = request.input('name')
        query.photo = request.input('photo')
        query.designation = request.input('designation')
        query.twitter_link = request.input('twitter_link')
        query.linkedin_link = request.input('linkedin_link')
        query.instagram_link = request.input('instagram_link')
        query.is_board_of_directors = request.input('is_board_of_directors')
        query.is_executive_managment = request.input('is_executive_managment')
        query.is_active = request.input('is_active')
        query.start_date = request.input('start_date')
        query.end_date = request.input('end_date')

        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, response }) {
        const query = VendorKeyPerson.query()
        query.where('id', params.id)
        const result = await query.firstOrFail()
        return response.status(200).send(result)
    }

    async update({ params, request, response }) {
        const query = await VendorKeyPerson.findOrFail(params.id)
        query.vendor_id = request.input('vendor_id')
        query.name = request.input('name')
        query.photo = request.input('photo')
        query.designation = request.input('designation')
        query.twitter_link = request.input('twitter_link')
        query.linkedin_link = request.input('linkedin_link')
        query.instagram_link = request.input('instagram_link')
        query.is_board_of_directors = request.input('is_board_of_directors')
        query.is_executive_managment = request.input('is_executive_managment')
        query.is_active = request.input('is_active')
        query.start_date = request.input('start_date')
        query.end_date = request.input('end_date')
        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, response }) {
        const query = await VendorKeyPerson.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }
}

module.exports = VendorKeyPersonController
