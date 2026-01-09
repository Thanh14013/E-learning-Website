import api from "./api";

const analyticsService = {
  getDashboardAnalytics: async () => {
    const response = await api.get("/analytics/dashboard");
    return response.data; // { success: true, data: { ... } }
  },
};

export default analyticsService;
