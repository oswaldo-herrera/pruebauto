import {
	Row,
	Col,
	Card,
	CardBody,
	CardTitle,
	Breadcrumb,
	BreadcrumbItem,
} from "reactstrap";
import { Link, useLocation } from "react-router-dom";

const navigation = [
	{
		path:'reservation_page',
		url:'/reservation_page/create/',
		title:"Reservación Online"
	},
	{
		path:'update',
		url: "#",
		title:"Clave"
	},
	{
		path:'create',
		url: "#",
		title:"Nueva reserva"
	},
]

const getPathFound = (pathname) =>{
	let found = navigation.find(nav=>{return nav.path===pathname})
	if(found !== undefined){
		return found.url?found.url:"/"+found.path;
	}
	return "#";
}

const getTitleFound = (pathname) =>{
	let found = navigation.find(nav=>{return nav.path===pathname})
	if(found !== undefined){
		return found.title;
	}
	return pathname;
}

const BreadcrumbsReservation = () => {
	let location = useLocation()
	const location_array = location.pathname.split("/");
	return (
		<Breadcrumb>
			<BreadcrumbItem active={location.pathname=="/"}>
				<a href="/">Inicio</a>
			</BreadcrumbItem>
            {location_array.length > 2?
			<BreadcrumbItem>
				<Link to={getPathFound(location_array[1])}>{getTitleFound(location_array[1])}</Link>
			</BreadcrumbItem>
			:
			<BreadcrumbItem active>{getTitleFound(location_array[1])}</BreadcrumbItem>}
			{location_array.length > 2?

			location_array.length > 3?
			<BreadcrumbItem>
				<Link to={getPathFound(location_array[2])}>{getTitleFound(location_array[2])}</Link>
			</BreadcrumbItem>
			:
			<BreadcrumbItem active>{getTitleFound(location_array[2])}</BreadcrumbItem>
			:<></>}
			{location_array.length > 3?
			location_array.length > 4?
			<BreadcrumbItem>
				<Link to={getPathFound(location_array[3])}>{getTitleFound(location_array[3])}</Link>
			</BreadcrumbItem>
			:
			<BreadcrumbItem active>{getTitleFound(location_array[3])}</BreadcrumbItem>
			:<></>}
		</Breadcrumb>
	);
};

export default BreadcrumbsReservation;