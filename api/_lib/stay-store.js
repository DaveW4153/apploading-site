// Where the guest assistant's questions are kept, so a lodge can see what guests ask and add better answers.
//
// Nothing is stored yet: this is the seam for it. Until a database is connected, `enabled` is false,
// `logQuestion` does nothing, and the app tells guests their question is not kept.
//
// To switch storage on later, implement these three functions against a database and set `enabled` to true:
//
//   logQuestion({ property, question, lang, stage, topic, answered, at })
//       Called once per answered request. Never pass a guest's name, link, phone number or address:
//       the endpoint does not receive them, and they must not be added here.
//   listQuestions(property)      -> what an owner screen would show: most-asked topics, unanswered questions.
//   learnedAnswers(property)     -> answers the owner has added, appended to the lodge guide for later guests.
//
// The endpoint calls logQuestion and learnedAnswers already, so nothing in api/stay/ask.js has to change.

const enabled = false;

async function logQuestion(_entry) { /* no storage connected */ }

async function listQuestions(_property) { return []; }

async function learnedAnswers(_property) { return []; }

module.exports = { enabled, logQuestion, listQuestions, learnedAnswers };
