"use strict";

const Step = use("App/Models/Admin/ProductModule/Step");
const Flow = use("App/Models/Admin/ProductModule/Flow");
const FlowQuestion = use("App/Models/Admin/ProductModule/FlowQuestion");
const Question = use("App/Models/Admin/ProductModule/Question");

class StepController {
  async index({ request, response, view }) {
    const query = Step.query();

    const questionQuery = Question.query();
    let flowId = "";
    if (request.input("module_id")) {
      const flowQuery = await Flow.findByOrFail(
        "module_id",
        request.input("module_id")
      );

      if (flowQuery) {
        flowId = flowQuery.id;
        const questionIdsQuery = FlowQuestion.query();
        questionIdsQuery.where("flow_id", flowQuery.id);
        if (request.input("is_advanced") == false) {
          questionIdsQuery.where("is_advanced", false);
        }
        questionIdsQuery.orderBy("sort_order", "ASC");
        const questionIds = await questionIdsQuery.pluck("question_id");
        questionQuery.whereIn("id", questionIds);

        //const arrQuestions = await questionQuery.fetch();
        //console.log(arrQuestions.toJSON())

        const stepIds = await questionQuery.pluck("step_id");
        query.whereIn("id", stepIds);

        query.with("questions", (builder) => {
          builder.whereIn("id", questionIds).with("options.sub_options");
        });
      } else {
        query.whereIn("id", []);
      }
    }

    query.orderBy("sort_order", "ASC");
    const result = await query.fetch();
    const array = await result.toJSON();

    var dataArray = [];
    for (var i = 0; i < array.length; i++) {
      //const stepsId = array[i].id;

      const objQuestion = array[i];
      const arrQuestionIds = objQuestion.questions.map((v) => v.id);

      const questionIdsQuery = FlowQuestion.query();
      questionIdsQuery.whereIn("question_id", arrQuestionIds);
      questionIdsQuery.distinct("question_id");
      questionIdsQuery.orderBy("sort_order", "ASC");
      questionIdsQuery.where("flow_id", flowId);
      const questionIds = await questionIdsQuery.pluck("question_id");

      objQuestion.questions = [];
      for (var j = 0; j < questionIds.length; j++) {
        const questionQuery1 = Question.query();
        questionQuery1.with("options.sub_options");
        questionQuery1.where("id", questionIds[j]);
        const arrQuestions = await questionQuery1.fetch();
        //console.log(arrQuestions.toJSON())
        objQuestion.questions.push(arrQuestions.toJSON()[0]);
      }
      dataArray.push(objQuestion);
    }

    let additionalQuestions = [];

    const findArray = dataArray.find(
      (data) => data.name == "Additional Information"
    );
    const findArrayIndex = dataArray.findIndex(
      (data) => data.name == "Additional Information"
    );

    if (findArray) {
      if (!request.input("admin")) {
        dataArray.splice(findArrayIndex, 1);
      }

      dataArray.questions.forEach((element) => {
        additionalQuestions.push(element);
      });
    }

    if (!request.input("admin")) {
      additionalQuestions.push({
        id: "country_select",
        step_id: 3,
        option_type: "country_select",
        name: "Where are you located ?",
        tags: "",
        notes: "",
        options: [],
      });
      additionalQuestions.push({
        id: "industry_select",
        step_id: 3,
        option_type: "industry_select",
        name: "Select Industry Vertical",
        tags: "",
        notes: "",
        options: [],
      });

      dataArray.push({
        id: 3,
        name: "Additional Information",
        questions: additionalQuestions,
      });
    }

    return response.status(200).send(dataArray);
  }
}

module.exports = StepController;
