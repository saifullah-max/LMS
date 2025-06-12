// scheduler/assignmentReminder.js
const cron = require("node-cron");
const Assignment = require("../model/Assignment");
const User = require("../model/User");
const { sendEmail } = require("../utils/email"); // adjust according to your utils
 
const assignmentReminder = () => {
  // Run every hour
  cron.schedule("*/10 * * * *", async () => {
    console.log("Checking for upcoming assignment deadlines...");
    console.log("Running every 10 minutes");

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    try {
      const assignments = await Assignment.find({
        deadline: { $gte: now, $lte: oneHourLater },
      }).populate("course", "students title");

      for (const asg of assignments) {
        // Get list of student IDs in the course
        const courseStudents = asg.course.students;
        const students = await User.find({ _id: { $in: courseStudents } });

        for (const student of students) {
          // Check if student already submitted — if yes, skip
          const alreadySubmitted = asg.submissions.some((s) =>
            s.student.equals(student._id)
          );
          if (alreadySubmitted) continue;

          await sendEmail({
            to: student.email,
            subject: `⏰ Reminder: Assignment "${asg.title}" is due soon`,
            text: `Hi ${
              student.name
            },\n\nJust a reminder that your assignment "${
              asg.title
            }" is due at ${asg.deadline.toLocaleString()}.\n\nPlease submit it before the deadline.\n\nLMS Team`,
          });

          console.log(`Reminder sent to ${student.email}`);
        }
      }
    } catch (err) {
      console.error("Error in assignment reminder scheduler:", err);
    }
  });
};


module.exports = assignmentReminder