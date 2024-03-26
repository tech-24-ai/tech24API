'use strict'
const VisitorGroup = use('App/Models/Admin/VisitorModule/VisitorGroup')
const Database = use('Database')
const Query = use('Query')
const moment = require("moment");
const searchInFields = [
  'id',
  'name',
]
class VisitorGroupController {
  async index({ request, response }) {
    const query = VisitorGroup.query()
    query.with('modules')

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
    const query = new VisitorGroup()
    query.name = request.input('name')
    await query.save()
    await query.modules().detach()
    await query.modules().attach(JSON.parse(request.input('modules')))
    return response.status(200).send({ message: 'Create successfully' })
  }

  async show({ params, response }) {
    const query = VisitorGroup.query()
    query.where('id', params.id)
    const result = await query.first()
    const moduleIds = await result.modules().ids()
    result.modules = moduleIds
    return response.status(200).send(result)
  }

  async update({ params, request, response }) {
    const query = await VisitorGroup.findOrFail(params.id)
    query.name = request.input('name')
    await query.save()
    await query.modules().detach()
    await query.modules().attach(JSON.parse(request.input('modules')))
    return response.status(200).send({ message: 'Update successfully' })
  }

  async destroy({ params, response }) {
    const query = await VisitorGroup.findOrFail(params.id)
    try {
      await query.delete()
      return response.status(200).send({ message: 'Delete successfully' })
    } catch (error) {
      return response.status(423).send({ message: 'Something went wrong' })
    }
  }

  async modules() {
    return Database.table('module_visitor_group')
  }
}

module.exports = VisitorGroupController
