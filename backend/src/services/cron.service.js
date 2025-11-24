import cron from "node-cron";
import { collectDailyAnalytics } from "../services/analytics.service.js";

/**
 * Setup cron jobs for analytics collection
 */
export const setupAnalyticsCronJobs = () => {
  // Run daily at 00:00 UTC (midnight)
  // Cron format: second minute hour day month weekday
  // "0 0 * * *" = At 00:00 every day

  cron.schedule("0 0 * * *", async () => {
    console.log("🕐 Running daily analytics collection cron job...");

    try {
      const result = await collectDailyAnalytics();

      console.log("✅ Daily analytics collection completed:", result);
    } catch (error) {
      console.error("❌ Daily analytics collection failed:", error);
    }
  });

  console.log("✅ Analytics cron jobs scheduled");
  console.log("   - Daily analytics collection: Every day at 00:00 UTC");
};

/**
 * Manually trigger analytics collection (for testing or manual runs)
 * @param {Date} date - Optional date to collect analytics for
 */
export const triggerAnalyticsCollection = async (date = null) => {
  try {
    console.log("🔄 Manually triggering analytics collection...");

    const result = await collectDailyAnalytics(date);

    console.log("✅ Manual analytics collection completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Manual analytics collection failed:", error);
    throw error;
  }
};
