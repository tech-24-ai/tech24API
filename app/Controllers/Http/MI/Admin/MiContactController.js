'use strict'

const Contact = use('App/Models/MI/MiContact')
const Query = use('Query')
const moment = require("moment");
const Excel = require("exceljs");
class MiContactController {
    async index({ request, response }) {

        const query = Contact.query()

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })



        query.with('investors')

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
                        query.whereRaw(`DATE(mi_contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'updated_at':
                        query.whereRaw(`DATE(mi_contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    default:
                        query.whereRaw(`mi_contacts.${filter.name} LIKE '%${filter.value}%'`)
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
        const query = new Contact()
        query.email = request.input('email');
        query.mobile = request.input('mobile');
        query.name = request.input('name');
        query.message = request.input('message');
        query.isinvestor = false;
        query.investor_id = null;
        query.ip = "NA";
        query.country = "";
        query.city = "";

        await query.save()
        return response.status(200).send({ message: 'Create successfully' })
    }

    async show({ params, response }) {
        const query = await Contact.findOrFail(params.id)
        return response.status(200).send(query)
    }

    async update({ params, request, response }) {
        const query = await Contact.findOrFail(params.id)

        query.email = request.input('email');
        query.mobile = request.input('mobile');
        query.name = request.input('name');
        query.message = request.input('message');
        query.isinvestor = false;
        query.investor_id = null;
        query.ip = "NA";
        query.country = "";
        query.city = "";

        await query.save()
        return response.status(200).send({ message: 'Update successfully' })
    }

    async destroy({ params, response }) {
        const query = await Contact.findOrFail(params.id)

        try {
            await query.delete()
            return response.status(200).send({ message: 'Delete successfully' })
        } catch (error) {
            return response.status(423).send({ message: 'Something went wrong' })
        }
    }


    async exportReport({ request, response }) {

        const query = Contact.query()

        const search = request.input('search')
        const orderBy = request.input('orderBy')
        const orderDirection = request.input('orderDirection')
        const searchQuery = new Query(request, { order: 'id' })



        query.with('investors')

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
                        query.whereRaw(`DATE(contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    case 'updated_at':
                        query.whereRaw(`DATE(contacts.${filter.name}) = '${moment(filter.value).format('YYYY-MM-DD')}'`)
                        break;
                    default:
                        query.whereRaw(`contacts.${filter.name} LIKE '%${filter.value}%'`)
                        break;
                }
            })
        }

        var result = await query.fetch()

        const fileName = "mi-contacts-" + moment().format('yyyy-MM-DD') + ".xlsx";
        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet("MI Contact List");
        let font = { name: "Arial", size: 12 };

        const data = await result.toJSON();
        let exportData = [];
        let index = 1;
        if (data) {
            data.forEach((element) => {

                let registerd_user = "Yes";

                if (element.investor_id == 0)
                    registerd_user = "No";

                exportData.push({
                    sno: index++,
                    name: element.name,
                    email: element.email,
                    mobile: element.mobile,
                    ip: element.ip,
                    country: element.country,
                    city: element.city,
                    registerd_user: element.registerd_user,
                    created: element.created_at,
                    updated: element.updated_at,
                });
            });


        }


        let columns = [
            { header: "S. No.", key: "sno", width: 10, style: { font: font } },
            { header: "Name", key: "name", width: 50, style: { font: font } },
            { header: "Mobile", key: "mobile", width: 30, style: { font: font } },
            { header: "Email", key: "email", width: 40, style: { font: font } },
            { header: "IP address", key: "ip", width: 40, style: { font: font } },
            { header: "Country", key: "country", width: 40, style: { font: font } },
            { header: "City", key: "city", width: 40, style: { font: font } },
            { header: "Registered User", key: "registerd_user", width: 40, style: { font: font } },
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

module.exports = MiContactController
