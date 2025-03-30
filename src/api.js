import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL + "/api/v1",
    withCredentials: true, // Ensures cookies & tokens are sent
});

export default API;
