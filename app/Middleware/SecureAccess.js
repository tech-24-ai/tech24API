"use strict";
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class SecureAccess {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request,response }, next) {
    if (request.input("access_token") == "FECEB12C7464FDA1E26591FE67B82B34") {
      await next();
    } else {
      response.send({message:"Invalid Access Token"})
    }
  }
}

module.exports = SecureAccess;
