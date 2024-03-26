'use strict'

const Country = use('App/Models/Admin/LocationModule/Country')
const Query = use('Query')
const moment = require("moment");
const Excel = require("exceljs");
const searchInFields = [
    'countries.sortname',
    'countries.name',
]
class CountryController {
    async index({ request, response, view }) {
        const query = Country.query()
        query.select('countries.*');
        query.select('country_groups.name as country_group');
        query.leftJoin('country_groups', 'country_groups.id', 'countries.group_id')

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

        if (request.input('active')) {
            query.where('countries.active', request.input('active'))
        }

        if (request.input('filters')) {
            const filters = JSON.parse(request.input('filters'))
            filters.forEach(filter => {
                if (filter.name == 'country_group') {
                    query.whereRaw(`country_groups.name LIKE '%${filter.value}%'`)
                } else {
                    query.whereRaw(`countries.${filter.name} LIKE '%${filter.value}%'`)
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
        const query = new Country()
        query.name = request.input('name')
        query.sortname = request.input('sortname')
        query.phonecode = request.input('phonecode')
        query.group_id = request.input('group_id')
        query.active = request.input('active')
        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, request, response, view }) {
        const query = Country.query()
        query.select('countries.*');
        query.select('country_groups.name as group');
        query.leftJoin('country_groups', 'country_groups.id', 'countries.group_id')
        query.where('countries.id', params.id)
        const result = await query.firstOrFail()
        return response.status(200).send(result)

    }

    async update({ params, request, response }) {
        const query = await Country.findOrFail(params.id)
        query.name = request.input('name')
        query.sortname = request.input('sortname')
        query.phonecode = request.input('phonecode')
        query.group_id = request.input('group_id')
        query.active = request.input('active')
        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, request, response }) {
        const query = await Country.findOrFail(params.id)
        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }

    async exportReport({ request, response, view, auth }) {
        
        const query = Country.query()
        query.select('countries.*');
        query.select('country_groups.name as country_group');
        query.leftJoin('country_groups', 'country_groups.id', 'countries.group_id')

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

        if (request.input('active')) {
            query.where('countries.active', request.input('active'))
        }

        if (request.input('filters')) {
            const filters = JSON.parse(request.input('filters'))
            filters.forEach(filter => {
                if (filter.name == 'country_group') {
                    query.whereRaw(`country_groups.name LIKE '%${filter.value}%'`)
                } else {
                    query.whereRaw(`countries.${filter.name} LIKE '%${filter.value}%'`)
                }
            })
        }

        var result = await query.fetch()

        const fileName = "countries-" + moment().format('yyyy-MM-DD') + ".xlsx";
        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet("Country List");
        let font = { name: "Arial", size: 12 };

        const data = await result.toJSON();
        let exportData = [];
        let index = 1;
        if (data) {
            data.forEach((element) => {

                let status = "Inactive";

                if (element.active == 1) {
                    status = "Active";
                } 

                exportData.push({
                    sno: index++,
                    name: element.name,
                    sortname: element.sortname,
                    phonecode: element.phonecode,
                    group_id: element.country_group,
                    status: status,
                    created: element.created_at,
                    updated: element.updated_at,
                });
            });


        }

       
        let columns = [
            { header: "S. No.", key: "sno", width: 10, style: { font: font } },
            { header: "Country", key: "name", width: 30, style: { font: font } },
            { header: "Sort Name", key: "sortname", width: 30, style: { font: font } },
            { header: "Phone Code", key: "phonecode", width: 30, style: { font: font } },
            { header: "Country Group", key: "group_id", width: 30, style: { font: font } },
            { header: "Status", key: "status", width: 20, style: { font: font } },
            { header: "Created", key: "created_at", width: 30, style: { font: font } },
            { header: "Updated", key: "updated_at", width: 30, style: { font: font } },
        ];


        worksheet.columns = columns;
        worksheet.addRows(exportData);

        worksheet.getCell("B1", "C1").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "cccccc" },
        };


        response.header(
            `Content-Type`,
            `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        );
        response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
        return workbook.xlsx.writeBuffer(response);
    }

}

module.exports = CountryController
