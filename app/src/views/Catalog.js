import React,{Component} from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Row, Col, CardSubtitle, CardBody, CardTitle, Button, Table, Input } from "reactstrap";
import { getProfile, Profile, User } from "../components/user/UserModel";
import SimpleList from "../components/catalog/SimpleList";
import StoreList from '../components/catalog/StoreList';
import DepartmentCECOSList from '../components/catalog/DepartmentCECOSList';
import ExchangeRateList from '../components/catalog/ExchangeRateList';
import HotelList from '../components/catalog/HotelList';
import ProviderList from '../components/catalog/ProviderList';
import SaleTypeList from '../components/catalog/SaleTypeList';
import UnitList from '../components/catalog/UnitList';
import PaymentMethodList from '../components/catalog/PaymentMethodList';
import ServiceList from '../components/catalog/ServiceList';
import AvailabilityGroupList from '../components/catalog/AvailabilityGroupList';
import DiscountList from '../components/catalog/DiscountList';
import RepresentativeList from '../components/catalog/RepresentativeList';
import CoordinatorsComissionList from '../components/catalog/CoordinatorsComissionList';
import AuthDiscountList from '../components/catalog/AuthDiscountList';
import ReservationLogList from '../components/catalog/ReservationLogList';
import SaleLogList from '../components/catalog/SaleLogList';
const forms = [
  { key: 'activities', value: 'activity', name: "Actividades" },
  { key: 'contacts', value: 'contact', name: "Contactos" },
  { key: 'business_groups', value: 'business_group', name: "Grupo de negocios" },
  { key: 'operation_types', value: 'operation_type', name: "Tipos de operación" },
  { key: 'departmentscecos', value: 'departmentcecos', name: "Departamentos CECOS" },
  { key: 'exchangerates', value: 'exchangerate', name: "Tipos de cambio" },
  { key: 'coordinators_comissions', value: 'coordinators_comission', name: "Comisión de coordinadores pagos directos" },
  { key: 'saletypes', value: 'saletype', name: "Tipos de venta" },
  { key: 'payment_types', value: 'payment_type', name: "Tipos de formas de pago" },
  { key: 'client_types', value: 'client_type', name: "Tipos de clientes" },
  { key: 'groups', value: 'group', name: "Grupos de grupos" },
  { key: 'payment_methods', value: 'payment_method', name: "Formas de pago" },
  { key: 'representatives', value: 'representative', name: "Representantes" },
  { key: 'hotels', value: 'hotel', name: "Hoteles" },
  //{ key: 'stores', value: 'store', name: "Tiendas" },
  { key: 'providers', value: 'provider', name: "Proveedores" },
  { key: 'unit_types', value: 'unit_type', name: "Tipos de unidades" },
  { key: 'units', value: 'unit', name: "Unidades" },
  { key: 'services', value: 'service', name: "Servicios" },
  { key: 'availability_groups', value: 'availability_group', name: "Grupos de disponibilidad" },
  { key: 'discounts', value: 'discount', name: "Descuentos" },
  { key: 'auth_discounts', value: 'auth_discount', name: "Autorización de descuentos" },
  { key: 'reservation_logs', value: 'reservation_log', name: "Registro de reservacion" },
  { key: 'sale_logs', value: 'sale_log', name: "Registro de venta" },
]
//const navigate = useNavigate();
class Catalog extends Component{
	constructor(props){
		super(props);
		let form = forms.find(form => form.key===props.table);
		this.state = {
			table:props.table,
			form: form===undefined?"":form.value,
			search:"",
			user_extension:new Profile({
				id:null,
				user: new User(null,"","","","","",false,false),
				properties:[],
				permissions:[]
			})
		};
	}

	loadProfile(){
		getProfile().then((result) =>{
			this.setState({
				user_extension: new Profile(result)
			});
		});
	}
  
	componentDidMount(){
		this.refreshComponent(this.props.table);
		this.loadProfile();
	}

	componentDidUpdate(prevProps, prevState){
		if (prevProps.table !== this.props.table) {
			this.refreshComponent(this.props.table);
		}
	}

	refreshComponent(table){
		let form = forms.find(form => form.key===table);
		this.setState({
			table: table,
			form: form===undefined?"":form.value
		});
	};

	onChangeSelection(e) {
		let form = forms.find(form => form.key===e.target.value);
		this.setState({
			table: e.target.value,
			form: form===undefined?"":form.value,
			search:""
		});
		this.props.history('/catalogs/'+e.target.value)
	};

	onChangeSearch(e) {
		this.setState({
			search: e.target.value,
		});
	};

	getFilterView(){
    	let permision = this.state.user_extension.permissions.find((permision)=>permision=="GeneralApp.catalogs_view"||permision=="GeneralApp.catalogs_management");
    	return permision !== undefined || this.state.user_extension.user.is_superuser == true;
  	}

	getFilterTable(table){
		if(this.state.table === table){
			let permision = this.state.user_extension.permissions.find((permision)=>permision=="GeneralApp.catalogs_view"||permision=="GeneralApp.catalogs_management");
			return permision !== undefined || this.state.user_extension.user.is_superuser == true;
		}
		return false
  	}

	render(){
		const { table, form, search } = this.state;
		return (
			<Row>
				{this.getFilterView()?<>
				<Col lg="3">
					<Input
						bsSize="sm"
						name="select-catalog"
						type="select"
						value={table}
						onChange={this.onChangeSelection.bind(this)}>
							<option value="">
								Seleccionar catalogo
							</option>
							{forms.map((form, index) => (
								<option key={form.key} value={form.key}>
									{form.name}
								</option>
							))}
					</Input>
				</Col>
				{table!=="auth_discounts"&&table!=="reservation_logs"&&table!=="sale_logs"?
				<Col lg="2">
					<Link to={table===""?"#":"/catalogs/"+form+"/"}>
						<Button className="btn" color="primary" size="sm" block disabled={table===""}>
							<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
						</Button>
					</Link>
				</Col>:<></>}
				<Col></Col>
				<Col lg="4">
					<Input
						bsSize="sm"
						name="search"
						placeholder="Busqueda"
						type="search"
						value={search}
						onChange={this.onChangeSearch.bind(this)}/>
				</Col>
				<Col lg="12" style={{"minHeight":"500px"}}>
					{this.getFilterTable("activities")?<SimpleList search={search} model={{url:'general/activities',name:'activity',title:"actividades",type:"properties"}} />:<></>}
					{this.getFilterTable("business_groups")?<SimpleList search={search} model={{url:'general/business_groups',name:'business_group',title:"Grupos de negocio",type:"properties"}} />:<></>}
					{this.getFilterTable("operation_types")?<SimpleList search={search} model={{url:'general/operation_types',name:'operation_type',title:"Tipos de operación",type:"properties"}} />:<></>}
					{this.getFilterTable("unit_types")?<SimpleList search={search} model={{url:'general/unit_types',name:'unit_type',title:"Tipo de unidades",type:"property"}} />:<></>}
					{this.getFilterTable("payment_methods")?<PaymentMethodList search={search} />:<></>}
					{this.getFilterTable("representatives")?<RepresentativeList search={search} />:<></>}
					{this.getFilterTable("payment_types")?<SimpleList search={search} model={{url:'sales/payment_types',name:'payment_type',title:"Tipo de forma de pago",type:""}} />:<></>}
					{this.getFilterTable("client_types")?<SimpleList search={search} model={{url:'sales/client_types',name:'client_type',title:"Tipo de cliente",type:"property"}} />:<></>}
					{this.getFilterTable("groups")?<SimpleList search={search} model={{url:'general/groups',name:'group',title:"Grupo de grupo",type:"properties"}} />:<></>}
					{this.getFilterTable("contacts")?<SimpleList search={search} model={{url:'operations/contacts',name:'contact',title:"Contacto",type:"properties"}} />:<></>}
					{this.getFilterTable("departmentscecos")?<DepartmentCECOSList search={search} />:<></>}
					{/* {table==="stores"?<StoreList search={search} />:<></>} */}
					{this.getFilterTable("exchangerates")?<ExchangeRateList search={search} />:<></>}
					{this.getFilterTable("coordinators_comissions")?<CoordinatorsComissionList search={search} />:<></>}
					{this.getFilterTable("saletypes")?<SaleTypeList search={search} />:<></>}
					{this.getFilterTable("hotels")?<HotelList search={search} />:<></>}
					{this.getFilterTable("providers")?<ProviderList search={search} />:<></>}
					{this.getFilterTable("discounts")?<DiscountList search={search} />:<></>}
					{this.getFilterTable("auth_discounts")?<AuthDiscountList search={search} />:<></>}
					{this.getFilterTable("reservation_logs")?<ReservationLogList search={search} />:<></>}
					{this.getFilterTable("sale_logs")?<SaleLogList search={search} />:<></>}
					{this.getFilterTable("units")?<UnitList search={search} />:<></>}
					{this.getFilterTable("services")?<ServiceList search={search} />:<></>}
					{this.getFilterTable("availability_groups")?<AvailabilityGroupList search={search} />:<></>}
				</Col></>:<Col>No tiene permitido ver el catalogo</Col>}
			</Row>
		);
	}
}
export default function(props) {
  const history = useNavigate();
  const params = useParams(); 
  return <Catalog {...props} params = {params} history={history} />;
}