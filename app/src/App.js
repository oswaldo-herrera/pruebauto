import { Navigate, useRoutes } from "react-router-dom";
import Themeroutes from "./Router";
import { getCookie } from "./components/utils";
import axios from 'axios';
import moment from 'moment';
import FullLayout from "./layouts/FullLayout";
axios.defaults.headers.common['X-CSRFTOKEN'] = getCookie("csrftoken");
axios.defaults.headers.common['X-Requested-With'] = "XMLHttpRequest";
moment.locale("es-mx");
const App = () => {
  const routing = useRoutes(Themeroutes);
  return <div className="dark">{routing}</div>;
};
export default App;

