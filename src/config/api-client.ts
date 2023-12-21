import Axios from 'axios';
import get from 'lodash/get';

const getAuthToken = () => {
  try {
    const sidetimeStorage = JSON.parse(localStorage.getItem(`persist:${process.env.REACT_APP_WEBAPP_NAME}`) || '');
    const token = get(JSON.parse(get(sidetimeStorage, 'auth')), 'token');

    return token;
  } catch {
    return '';
  }
};

const AxiosClient = Axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Key-Inflection': 'camel',
    Authorization: `Bearer ${getAuthToken()}`
  }
});

export default AxiosClient;
