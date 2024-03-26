"use strict";
class StoreVendorFinancials {
  get rules() {
    const id = this.ctx.params.id;
    const { year, quarter, vendor_id } = this.ctx.request.all();
    return {
      year: `required|exists:vendor_financials,year:${year},quarter:${quarter},vendor_id:${vendor_id},not-id:${id}`,
      quarter: `required`,
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreVendorFinancials;
