import axios from 'axios'
import queryString from 'query-string'
import {appInfo} from '../constants/appInfos';

const axiosClient = axios.create({
    BASE_URL: appInfo.BASE_URL,
    paramSerializer: params => queryString.stringify(params),
});

axiosClient.interceptors.request.use(async (config) => {
    config.headers = {
        Authorization: '',
        Accept: 'application/json',
        ...config.headers,
    };
    config.data;

    return config;
});

axiosClient.interceptors.response.use(res => {
    if (res.data && res.status === 200) {
        return res.data;
    }
    throw new Error('Something went wrong');
}, error => {
    console.log(`Error: ${JSON.stringify(error)}`);
    throw new Error(error.response);
},
);

export default axiosClient;