"use strict";

const GPTChat = use("App/Models/Front/GPTModule/GptChat");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with gptchats
 */
class GptChatController {
  /**
   * Show a list of all gptchats.
   * GET gptchats
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    // response.send({ message: "data should be here" });
    return GPTChat.all();
  }

  /**
   * Render a form to be used for creating a new gptchat.
   * GET gptchats/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new gptchat.
   * POST gptchats
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    try {
      const data = await GPTChat.create({
        prompt_text: request.input("prompt_text"),
        troubleshooting: request.input("text"),
        subject: request.input("subject"),
        user_id: request.input("user_id"),
      });
      return response.send(data);
    } catch (error) {
      console.log(error);
      return response
        .status(423)
        .json({ message: "something went wrong", error });
    }
  }

  /**
   * Display a single gptchat.
   * GET gptchats/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {}

  /**
   * Render a form to update an existing gptchat.
   * GET gptchats/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update gptchat details.
   * PUT or PATCH gptchats/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a gptchat with id.
   * DELETE gptchats/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = GptChatController;
