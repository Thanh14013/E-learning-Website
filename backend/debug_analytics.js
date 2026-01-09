import mongoose from "mongoose";
import dotenv from "dotenv";
import Progress from "./src/models/progress.model.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityRaw = await Progress.aggregate([
      { $match: { updatedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log("Aggregation Result:", activityRaw);

    const dailyActivity = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = d.toISOString().split('T')[0];
        const found = activityRaw.find(a => a._id === dateStr);
        dailyActivity.push({
            date: dateStr,
            activities: found ? found.count : 0
        });
    }
    console.log("Processed Data:", dailyActivity);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
