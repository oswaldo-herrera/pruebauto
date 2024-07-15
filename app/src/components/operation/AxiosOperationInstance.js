import axios from 'axios';
import { ApiOperationsUrl } from '../../constants/api/site';

const AxiosOperationInstance = axios.create({
  baseURL: ApiOperationsUrl, // Reemplaza esto con tu URL base
});

AxiosOperationInstance.cancelAllRequests = () => {
    AxiosOperationInstance.interceptors.request.handlers.forEach((handler) => {
        AxiosOperationInstance.interceptors.request.eject(handler);
    });
};

export default AxiosOperationInstance;