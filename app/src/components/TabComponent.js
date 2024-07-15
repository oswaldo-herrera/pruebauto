import { useState } from "react";
import { Nav, NavLink, NavItem, TabContent, TabPane } from "reactstrap";

const TabComponent = (props) => {
	const [activeTab, setActiveTab] = useState(props.currentTab?props.currentTab:"0");
	return (<>
		<Nav tabs className={props.className?props.className:""}>
		{props.tabs.map((tab)=>(
			<NavItem id={tab.key}>
				<NavLink className={activeTab === ""+tab.key?"active":""}
					onClick={()=> setActiveTab(""+tab.key)}>
					{tab.title}
				</NavLink>
			</NavItem>
		))}
		</Nav>
		<TabContent activeTab={activeTab} style={{"minHeight":"250px"}}>
		{props.tabs.map((tab)=>(
			<TabPane tabId={""+tab.key} id={tab.key} className={"m-3"}>
				{tab.component}
			</TabPane>
		))}
		</TabContent>
	</>);
};
export default TabComponent;