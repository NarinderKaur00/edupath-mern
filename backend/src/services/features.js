// The core subjects used as model INPUTS, with friendly names + semester.
// Ported from thapar_map.py (FEATURE_MAP). Used to render the marks form.
export const FEATURE_MAP = [
  ["UES103", "Programming for Problem Solving", "Semester 1"],
  ["UMA022", "Calculus for Engineers", "Semester 1"],
  ["UCB009", "Chemistry", "Semester 1"],
  ["UES013", "Electrical & Electronics Engg.", "Semester 1"],
  ["UPH013", "Physics", "Semester 2"],
  ["UES101", "Engineering Drawing", "Semester 2"],
  ["UHU003", "Professional Communication", "Semester 2"],
  ["UES102", "Manufacturing Processes", "Semester 2"],
  ["UMA023", "Differential Eqns & Linear Algebra", "Semester 2"],
  ["UCS301", "Data Structures", "Semester 3"],
  ["UTA018", "Object Oriented Programming", "Semester 3"],
  ["UCS303", "Operating System", "Semester 3"],
  ["UCS405", "Discrete Mathematical Structures", "Semester 3"],
  ["UMA021", "Numerical Linear Algebra", "Semester 3"],
  ["UCS310", "Database Management Systems", "Semester 4"],
  ["UCS414", "Computer Networks", "Semester 4"],
  ["UCS415", "Design & Analysis of Algorithms", "Semester 4"],
  ["UMA401", "Probability & Statistics", "Semester 4"],
  ["UCS321", "AI for Engineers", "Semester 4"],
  ["UML501", "Machine Learning", "Semester 5"],
  ["UCS503", "Software Engineering", "Semester 5"],
  ["UCS510", "Computer Architecture & Org.", "Semester 5"],
];

// Group subjects by semester for a tidy form: [{ semester, items:[{code,name}] }]
export function feature_groups() {
  const order = [];
  const map = {};
  for (const [code, name, sem] of FEATURE_MAP) {
    if (!map[sem]) {
      map[sem] = [];
      order.push(sem);
    }
    map[sem].push({ code, name });
  }
  return order.map((sem) => ({ semester: sem, items: map[sem] }));
}
