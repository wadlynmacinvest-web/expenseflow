import axios from "axios";

const api = axios.create({
  baseURL: "https://expenseflow-1-723v.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Ensure headers object exists and set Authorization with Bearer scheme
    if (!config.headers) {
      (config as any).headers = {};
    }
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
