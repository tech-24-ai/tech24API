const { KEYS } = require("../Helper/constants");
const Config = use("App/Models/Admin/ConfigModule/Config");

async function getSubmitQuestionPoints() {
  let answerPoints = await Config.findOrCreate(
    { key: KEYS.SUBMIT_QUESTION_POINTS },
    { key: KEYS.SUBMIT_QUESTION_POINTS, value: 1 }
  );
  return answerPoints.value;
}

async function getSubmitAnswerPoints() {
  let answerPoints = await Config.findOrCreate(
    { key: KEYS.SUBMIT_ANSWER_POINTS },
    { key: KEYS.SUBMIT_ANSWER_POINTS, value: 1 }
  );
  return answerPoints.value;
}

async function getUpvoteAnswerPoints() {
  let upvotesPoints = await Config.findOrCreate(
    { key: KEYS.UPVOTES_ANSWER_POINTS },
    { key: KEYS.UPVOTES_ANSWER_POINTS, value: 1 }
  );
  return upvotesPoints.value;
}

async function getCorrectAnswerPoints() {
  let acceptAnswerPoints = await Config.findOrCreate(
    { key: KEYS.CORRECT_ANSWER_POINTS },
    { key: KEYS.CORRECT_ANSWER_POINTS, value: 1 }
  );
  return acceptAnswerPoints.value;
}

async function getUpvoteQuestionPoints() {
  let questionUpvotePoints = await Config.findOrCreate(
    { key: KEYS.UPVOTES_QUESTION_POINTS },
    { key: KEYS.UPVOTES_QUESTION_POINTS, value: 1 }
  );
  return questionUpvotePoints.value;
}

module.exports = {
  getSubmitQuestionPoints,
  getSubmitAnswerPoints,
  getUpvoteAnswerPoints,
  getCorrectAnswerPoints,
  getUpvoteQuestionPoints,
};
