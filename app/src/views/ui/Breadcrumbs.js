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
		path:'catalogs',
		title:"Catálogo"
	},
	{
		path:'sales',
		title:"VP-Ventas"
	},
	{
		path:'sale',
		url:'/sales',
		title:"VP-Ventas"
	},
	{
		path:'sale_reserved',
		url:'/sales',
		title:"VP-Ventas"
	},
	{
		path:'allotments',
		title:"Cierres de disponibilidad"
	},
	{
		path:'operations_vp',
		title:"Operaciones VP"
	},
	{
		path:'operations',
		title:"Operaciones"
	},
	{
		path:'activities',
		title:"Actividades"
	},
	{
		path:'activity',
		url:'/catalogs/activities',
		title:"Actividad"
	},
	{
		path:'contacts',
		title:"Contactos"
	},
	{
		path:'contact',
		url:'/catalogs/contacts',
		title:"Contacto"
	},
	{
		path:'unit_types',
		title:"Tipos de unidades"
	},
	{
		path:'unit_type',
		url:'/catalogs/unit_types',
		title:"Tipo de unidad"
	},
	{
		path:'business_groups',
		title:"Grupo de negocios"
	},
	{
		path:'business_group',
		url:'/catalogs/business_groups',
		title:"Grupo de negocio"
	},
	{
		path:'operation_types',
		title:"Tipos de operación"
	},
	{
		path:'operation_type',
		url:'/catalogs/operation_types',
		title:"Tipo de operación"
	},
	{
		path:'payment_types',
		title:"Tipos de formas de pago"
	},
	{
		path:'payment_type',
		url:'/catalogs/payment_types',
		title:"Tipo de forma de pago"
	},
	{
		path:'client_types',
		title:"Tipos de clientes"
	},
	{
		path:'client_type',
		url:'/catalogs/client_types',
		title:"Tipo de cliente"
	},
	{
		path:'auth_discounts',
		title:"Autorizaciones de descuentos"
	},
	{
		path:'reservation_logs',
		title:"Registro de reservaciones"
	},
	{
		path:'sale_logs',
		title:"Registro de ventas"
	},
	{
		path:'discounts',
		title:"Descuentos"
	},
	{
		path:'discount',
		url:'/catalogs/discounts',
		title:"Descuento"
	},
	{
		path:'groups',
		title:"Grupos de grupo"
	},
	{
		path:'group',
		url:'/catalogs/groups',
		title:"Grupo de grupo"
	},
	{
		path:'payment_methods',
		title:"Formas de pago"
	},
	{
		path:'payment_method',
		url:'/catalogs/payment_methods',
		title:"Forma de pago"
	},
	{
		path:'representatives',
		title:"Representantes"
	},
	{
		path:'representative',
		url:'/catalogs/representatives',
		title:"Representante"
	},
	{
		path:'departmentscecos',
		title:"Departamentos CECOS"
	},
	{
		path:'departmentcecos',
		url:'/catalogs/departmentscecos',
		title:"Departamento CECOS"
	},
	{
		path:'exchangerates',
		title:"Tipos de cambio"
	},
	{
		path:'exchangerate',
		url:'/catalogs/exchangerates',
		title:"Tipo de cambio"
	},
	{
		path:'coordinators_comissions',
		title:"Comisiones de coordinadores pagos directos"
	},
	{
		path:'coordinators_comission',
		url:'/catalogs/coordinators_comissions',
		title:"Comisión de coordinadores pagos directos"
	},
	{
		path:'saletypes',
		title:"Tipos de venta"
	},
	{
		path:'saletype',
		url:'/catalogs/saletypes',
		title:"Tipo de venta"
	},
	{
		path:'hotels',
		title:"Hoteles"
	},
	{
		path:'hotel',
		url:'/catalogs/hotels',
		title:"Hotel"
	},
	{
		path:'providers',
		title:"Proveedores"
	},
	{
		path:'provider',
		url:'/catalogs/providers',
		title:"Proveedor"
	},
	{
		path:'units',
		title:"Unidades"
	},
	{
		path:'unit',
		url:'/catalogs/units',
		title:"Unidad"
	},
	/* {
		path:'stores',
		title:"Tiendas"
	},
	{
		path:'store',
		url:'/catalogs/stores',
		title:"Tienda"
	}, */
	{
		path:'services',
		title:"Servicios"
	},
	{
		path:'service',
		url:'/catalogs/services',
		title:"Servicio"
	},
	{
		path:'availability_groups',
		title:"Grupos de disponibilidad"
	},
	{
		path:'availability_group',
		url:'/catalogs/availability_groups',
		title:"Grupo de disponibilidad"
	},
	{
		path:'user_admin',
		title:"Usuarios de sistema"
	},
	{
		path:'user_extension',
		url:'/user_admin',
		title:"Usuario de sistema"
	},
	{
		path:'requests',
		title:"Consultas al api"
	},
	{
		path:'permission_groups',
		title:"Grupos de permisos"
	},
	{
		path:'permission_group',
		url:'/permission_groups',
		title:"Grupo de permisos"
	},
	{
		path:'profile',
		title:"Perfil"
	},
	{
		path:'reservations',
		title:"Reservaciónes"
	},
	{
		path:'reservation',
		url:'/reservations',
		title:"Reservación"
	},
	{
		path:'flights',
		title:"Vuelos"
	},
	{
		path:'flight',
		url:'/flights',
		title:"Vuelo"
	},
	{
		path:'store_cards',
		title:"Monedero"
	},
	{
		path:'store_card',
		url:'/store_cards',
		title:"Monedero"
	},
	{
		path:'pick_ups',
		title:"Pick Ups"
	},
	{
		path:'pick_up',
		url:'/pick_ups',
		title:"Pick Up"
	},
	{
		path:'provider_costs',
		title:"Facturas de Proveedor"
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

const Breadcrumbs = () => {
	let location = useLocation()
	const location_array = location.pathname.split("/");
	return (
		<Breadcrumb>
			<BreadcrumbItem>
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

export default Breadcrumbs;
