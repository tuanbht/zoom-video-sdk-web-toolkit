import Axios from 'axios';
import get from 'lodash/get';

const AxiosClient = Axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Key-Inflection': 'camel',
    Authorization: `Bearer ${get(localStorage.getItem(''), 'auth.token')}`,
  }
});

export default AxiosClient;
