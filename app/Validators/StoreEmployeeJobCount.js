"use strict";

class StoreEmployeeJobCount {
  get rules() {
    const id = this.ctx.params.id;
    const { year, quarter, vendor_id } = this.ctx.request.all();
    return {
      vendor_id: "required",
      total_employee: "required",
      year: `required|exists:vendor_employee_job_counts,year:${year},quarter:${quarter},vendor_id:${vendor_id},not-id:${id}`,
      total_jobs: "required",
      quarter: "required",
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreEmployeeJobCount;
