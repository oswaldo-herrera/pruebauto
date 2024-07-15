import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumbs from  "../views/ui/Breadcrumbs"
import { getProfile, Profile, User } from "../components/user/UserModel";
import { 
  Container, 
  Card,
  CardBody,
  CardTitle
} from "reactstrap";
import { useEffect, useState } from "react";

const FullLayout = () => {
	const [user_extension, setUserExtension] = useState(new Profile({
		id:null,
		user: new User(null,"","","","","",false,false),
		properties:[],
		permissions:[]
	}))
	useEffect(()=>{
		if(user_extension.id === null)
			getProfile().then((result) =>{
				setUserExtension(new Profile(result));
			});
	});
  return (
    <main>
      {/********header**********/}
      <Header user_extension={user_extension} />
      <div className="pageWrapper d-lg-flex">
        {/********Sidebar**********/}
        <aside className="sidebarArea shadow" id="sidebarArea">
          <Sidebar />
        </aside>
        {/********Content Area**********/}
        <div className="contentArea">
          {/********Middle Content**********/}
          <Container className="p-4" fluid>
            <Card>
              <CardTitle className="border-bottom p-3 mb-0">
                <Breadcrumbs />
              </CardTitle>
              <CardBody className="">
                <Outlet />
              </CardBody>
            </Card>
          </Container>
        </div>
      </div>
    </main>
  );
};

export default FullLayout;
