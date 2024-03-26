'use strict'

const Query = use("Query");
const TransactionHistory = use("App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory");
const moment = require("moment");
const Excel = require("exceljs");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with subcriptions
 */


const requestOnly = [
  "payment_transaction_id",
  "transaction_status",
  "transaction_date",
  "transaction_amount",
  "transaction_details",
  "created_by",
  "updated_by"
];

const searchInFields = ["id", "payment_transaction_id", "transaction_status", "created_by"];

class ItmapEuTransactionHistoryController {
  /**
   * Show a list of all Transactionhistories.
   * GET Transactionhistories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {

    const query = TransactionHistory.query()

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

    query.with('users');

    var visitornamefilter = "";

    if (request.input('filters')) {
      const filters = JSON.parse(request.input('filters'))
      filters.forEach(filter => {
        switch (filter.name) {
          case 'users.name':
            visitornamefilter = filter.value;
            break;
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case 'Transaction_status':
            query.whereRaw(`itmap_eu_transaction_histories.transaction_status LIKE '%${filter.value}%'`)
            break;
          default:
            query.whereRaw(`itmap_eu_transaction_histories.${filter.name} LIKE '%${filter.value}%'`)
            break;
        }
      })
    }

    


    if(visitornamefilter.length > 0){
      const visitorids = await Visitor.query().whereRaw(`name LIKE '%${visitornamefilter}%'`).pluck('id');
      
      if(visitorids.length>0) query.whereRaw('user_id in (?)', [visitorids]);
    }

    
    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
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

  /**
   * Render a form to be used for creating a new Transactionhistory.
   * GET Transactionhistories/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view, auth }) {

    const query = new TransactionHistory()
    query.payment_transaction_id = request.input('payment_transaction_id')
    query.transaction_status = request.input('transaction_status')
    query.transaction_code = request.input('transaction_code')
    query.transaction_amount = request.input('transaction_amount')
    query.transaction_details = request.input('transaction_details')
    query.transaction_date = request.input('transaction_date')
    query.user_id = request.input('user_id')
    query.payment_type = request.input('payment_type')
    query.created_by = auth.user.id
    await query.save()
    return response.status(200).send({ message: 'Created successfully' })
  }

  /**
   * Create/save a new Transactionhistory.
   * POST Transactionhistories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const query = new TransactionHistory()
    query.payment_transaction_id = request.input('payment_transaction_id')
    query.transaction_status = request.input('transaction_status')
    query.transaction_code = request.input('transaction_code')
    query.transaction_amount = request.input('transaction_amount')
    query.transaction_details = request.input('Transaction_details')
    query.transaction_date = request.input('transaction_date')
    query.user_id = request.input('user_id')
    query.payment_type = request.input('payment_type')
    query.created_by = auth.user.id
    await query.save()
    return response.status(200).send({ message: 'Created successfully' })
  }

  /**
   * Display a single Transactionhistory.
   * GET Transactionhistories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = TransactionHistory.query();
    query.where("id", params.id);
    query.with('users');
    //return response.status(200).send(query)
    var result
    result = await query.fetch();

    return response.status(200).send(result);
  }


  /**
   * Update Transactionhistory details.
   * PUT or PATCH Transactionhistories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response, auth }) {

    const query = await TransactionHistory.findOrFail(params.id)
    query.payment_transaction_id = request.input('payment_transaction_id')
    query.transaction_status = request.input('transaction_status')
    query.transaction_code = request.input('transaction_code')
    query.transaction_amount = request.input('transaction_amount')
    query.transaction_details = request.input('transaction_details')
    query.transaction_date = request.input('transaction_date')
    query.user_id = request.input('user_id')
    query.payment_type = request.input('payment_type')

    await query.save()
    return response.status(200).send({ message: 'Updated successfully' })
  }

  /**
   * Delete a Transactionhistory with id.
   * DELETE Transactionhistories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await TransactionHistory.findOrFail(params.id)
    try {
      await query.delete()
      return response.status(200).send({ message: 'Deleted successfully' })
    } catch (error) {
      return response.status(423).send({ message: 'Something went wrong' })
    }
  }

  async exportReport({ request, response, view }) {

    const query = TransactionHistory.query()

    const search = request.input('search')
    const orderBy = request.input('orderBy')
    const orderDirection = request.input('orderDirection')
    const searchQuery = new Query(request, { order: 'id' })

    query.with('users', (builder) => {
      builder.select('id', 'name')
    });


    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection)
    }

    if (search) {
      query.where(searchQuery.search(searchInFields))
    }

    query.with('users');
  
    var visitornamefilter = "";

    if (request.input('filters')) {
      const filters = JSON.parse(request.input('filters'))
      filters.forEach(filter => {
        switch (filter.name) {
          case 'users.name':
            visitornamefilter = filter.value;
            break;
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                  "YYYY-MM-DD"
                )}'`
            );
            break;
          case 'Transaction_status':
            query.whereRaw(`itmap_eu_transaction_histories.transaction_status LIKE '%${filter.value}%'`)
            break;
          default:
            query.whereRaw(`itmap_eu_transaction_histories.${filter.name} LIKE '%${filter.value}%'`)
            break;
        }
      })
    }

    if(visitornamefilter.length > 0){
      const visitorids = await Visitor.query().whereRaw(`name LIKE '%${visitornamefilter}%'`).pluck('id');
      if(visitorids.length>0) query.whereRaw('user_id in (?)', [visitorids]);
    }

    
    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch()

    const fileName = "visitor-transaction-history-" + moment().format('yyyy-MM-DD') + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Visitor Transaction History List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {

        let payment_type = "Subscription"
        if (element.payment_type == 2) {
          payment_type = "Document Purchase"
        }

        let paypal_txn_id = "NA"
        if (element.payment_transaction_id) {
          paypal_txn_id = element.payment_transaction_id
        }

        exportData.push({
          sno: index++,
          paypal_id: paypal_txn_id,
          visitor: element.users.name,
          transaction_status: element.transaction_status,
          transaction_details: element.transaction_details,
          transaction_amount: element.transaction_amount,
          transaction_date: element.transaction_date,
          payment_type: payment_type,
          created: element.created_at,
          updated: element.updated_at,
        });
      });


    }


    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "PayPal ID", key: "paypal_id", width: 30, style: { font: font } },
      { header: "Visitor Name", key: "visitor", width: 30, style: { font: font } },
      { header: "Transaction Status", key: "transaction_status", width: 30, style: { font: font } },
      { header: "Transaction Details", key: "transaction_details", width: 40, style: { font: font } },
      { header: "Transaction ID", key: "transaction_id", width: 30, style: { font: font } },
      { header: "Transaction Date", key: "transaction_date", width: 30, style: { font: font } },
      { header: "Transaction Amount in USD", key: "transaction_amount", width: 30, style: { font: font } },
      { header: "Payment Type", key: "payment_type", width: 20, style: { font: font } },
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

module.exports = ItmapEuTransactionHistoryController
