import axios from "axios";

export const api = "http://192.170.0.96:8080";

export const client = axios.create({
  baseURL: api,
});
