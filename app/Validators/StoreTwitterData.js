"use strict";

class StoreTwitterData {
  get rules() {
    const id = this.ctx.params.id;
    const { year, month, vendor_id } = this.ctx.request.all();
    return {
      vendor_id: "required",
      tweet_count: "required",
      retweet_count: "required",
      number_followers: "required",
      mentions: "required",
      year: `required|exists:vendor_twitter_datas,year:${year},month:${month},vendor_id:${vendor_id},not-id:${id}`,
      month: "required",
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages);
  }
}

module.exports = StoreTwitterData;
