import axios from 'axios';
import { ApiSalesUrl } from '../../constants/api/site';

const AxiosSaleInstance = axios.create({
  baseURL: ApiSalesUrl, // Reemplaza esto con tu URL base
});

AxiosSaleInstance.cancelAllRequests = () => {
    AxiosSaleInstance.interceptors.request.handlers.forEach((handler) => {
        AxiosSaleInstance.interceptors.request.eject(handler);
    });
};

export default AxiosSaleInstance;