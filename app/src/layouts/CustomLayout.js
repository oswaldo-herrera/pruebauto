import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    Button,
	Navbar,
	NavbarBrand,
} from "reactstrap";
import BreadcrumbsSales from  "../views/ui/BreadcrumbsSales"
import BreadcrumbsReservation from  "../views/ui/BreadcrumbsReservation"
import { getProfile, Profile, User } from "../components/user/UserModel";
import { 
  Container, 
  Card,
  CardBody,
  CardTitle
} from "reactstrap";
import Logo from "./Logo";
import LogoWhite from "../assets/images/logos/adminprowhite.svg";

const CustomLayout = () => {
    let location = useLocation()
  return (
    <main>
        {/********header**********/}
        <Navbar color="white" light expand="md" className="fix-header">
			<div className="d-flex align-items-center">
				<div className="d-lg-block d-none me-5 pe-3">
					<Logo />
				</div>
				<NavbarBrand href="/">
					<img src={LogoWhite} alt="Your SVG" className="d-lg-none"/>
				</NavbarBrand>
			</div>
            <Link to={`/`}>
                <Button color="info" outline style={{textAlign:'right'}}>
                    <h4 className="bi bi-shield-lock" style={{margin:0}}></h4> 
                </Button>
            </Link>
		</Navbar>
        <div className="pageWrapper d-lg-flex">
            {/********Middle Content**********/}
            <Container className="p-4" fluid>
                <Card>
                    <CardTitle className="border-bottom p-3 mb-0">
                        {location.pathname.includes('/reservation_page')?
                        <BreadcrumbsReservation />
                        :
                        <BreadcrumbsSales />}
                    </CardTitle>
                    <CardBody className="">
                        <Outlet />
                    </CardBody>
                </Card>
            </Container>
        </div>
    </main>
  );
};

export default CustomLayout;