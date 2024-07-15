import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { getCookie } from "./components/utils";
import FullLayout from "./layouts/FullLayout";

function Outlog() {
  // 👇️ redirect to external URL
  window.location.replace('/login');

  return null;
}

export default function ProtectedRoutes() {
  const datosSesion = window.datosSesion;
  let auth = { token: datosSesion};
  const navigate = useNavigate();
  return auth.token ? <FullLayout /> : <Outlog />;
}