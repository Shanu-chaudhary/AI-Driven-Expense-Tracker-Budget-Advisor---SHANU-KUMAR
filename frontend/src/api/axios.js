import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api", // your backend base URL
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;