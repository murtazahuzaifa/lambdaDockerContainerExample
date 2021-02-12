import axios from "axios";

exports.instance = axios.create({
    baseURL: 'https://uabz7wahvh.execute-api.us-east-1.amazonaws.com'
});
