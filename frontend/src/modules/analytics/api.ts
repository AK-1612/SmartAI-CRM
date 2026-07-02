import { apiClient } from "../../services/apiClient";
import type { DashboardOverview, GrowthRecommendation, MetricEventType, TrendForecast } from "../../types/api";

export const analyticsApi = {
  overview: () => apiClient.get<DashboardOverview>("/analytics/dashboard/overview/").then((res) => res.data),

  trend: (eventType: MetricEventType, days = 30, forecastDays = 7) =>
    apiClient
      .get<TrendForecast>("/analytics/dashboard/trend/", {
        params: { event_type: eventType, days, forecast_days: forecastDays }
      })
      .then((res) => res.data),

  recommendations: () =>
    apiClient
      .get<{ recommendations: GrowthRecommendation[] }>("/analytics/dashboard/recommendations/")
      .then((res) => res.data),

  recordEvent: (eventType: MetricEventType, value?: number) =>
    apiClient
      .post("/analytics/events/", { event_type: eventType, value, occurred_at: new Date().toISOString() })
      .then((res) => res.data)
};
