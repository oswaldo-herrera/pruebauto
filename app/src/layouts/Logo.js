import LogoDark from "../assets/images/logos/logo_report.jpeg";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/">
      <img  src={LogoDark} height={75} alt="Your SVG"/>
    </Link>
  );
};

export default Logo;
