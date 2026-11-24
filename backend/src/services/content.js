// Loads the static course/curriculum catalogue exported from the Python source.
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(readFileSync(join(__dirname, "..", "data", "content.json"), "utf-8"));

export const courseGroups = DATA.course_groups;      // [{group, items, credits}]
export const courseDetails = DATA.course_details;    // {code: {...full detail}}
export const fieldsData = DATA.fields;               // {focus, prof_electives}
export const stats = {
  core_credits: DATA.core_credits,
  n_total: DATA.n_total,
  n_electives: DATA.n_electives,
};

export function getCourse(code) {
  return courseDetails[code] || null;
}
