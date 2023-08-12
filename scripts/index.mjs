import { scoreEvent, scoresToCsv } from "./points.mjs";
import { getEventStatuses } from "./tba.mjs";

const eventStatuses = await getEventStatuses("2023iri");

const scores = scoreEvent(eventStatuses);

console.log(scoresToCsv(scores));
