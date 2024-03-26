"use strict";
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const _ = require("lodash");

class IpBlocker {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response }, next) {
    const blockedList = await Visitor.query()
      .where("is_blocked", true)
      .pluck("visitor_ip");

    const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
    let ipadd = _.trim(_.first(ipAddress));
    ipadd = ipadd && ipadd != "" ? ipadd : request.request.socket.remoteAddress;

    if (blockedList.includes(`${ipadd}`)) {
      if (!request.header("Authorization")) {
        response.header("Cache-Control", "no-cache, no-store, must-revalidate");
        return response.status(300).send({ message: "IP BLOCKED" });
      }
    }

    // call next to advance the request
    await next();
  }
}

module.exports = IpBlocker;
