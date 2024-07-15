import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
	Navbar,
	Collapse,
	Nav,
	NavItem,
	NavbarBrand,
	UncontrolledDropdown,
	DropdownToggle,
	DropdownMenu,
	DropdownItem,
	Dropdown,
	Button,
} from "reactstrap";
import Logo from "./Logo";
import LogoWhite from "../assets/images/logos/adminprowhite.svg";
import user1 from "../assets/images/users/user4.jpg";
import ModalOperationFilterListReport from "../components/operation/ModalOperationFilterListReport";
import ModalOperationFilterSummary from "../components/operation/ModalOperationFilterSummary";
import ModalSaleFilterListReport from "../components/sale/ModalSaleFilterListReport";
import ModalSaleFilterSapReport from "../components/sale/ModalSaleFilterSapReport";
import ModalOperationFilterCouponReport from "../components/operation/ModalOperationFilterCouponReport";

const Header = (props) => {

	const [modal_op_filter_list, setModal_op_filter_list] = useState({
		open:false,
		params:{
			start_date:"",
			due_date:"",
			file:"pdf",
			type:"ARRIVALS",
			reservation_confirm:"CONF",
			hotels:[],
			services:[],
			sale_types: [],
			operation_types: [],
			property:null
		},
		options_hotels: [],
		options_services: [],
		options_sale_types: [],
		options_operation_types: [],
	});

	const [modal_op_filter_coupons, setModal_op_filter_coupons] = useState({
		open:false,
		params:{
			start_date:"",
			due_date:"",
			file:"pdf",
			type:"ARRIVALS",
			reservation_confirm:"CONF",
			hotels:[],
			services:[],
			sale_types: [],
			operation_types: [],
			property:null
		},
		options_hotels: [],
		options_services: [],
		options_sale_types: [],
		options_operation_types: [],
	});

	const [modal_filter_summary, setModal_filter_summary] = useState({
		open:false,
		params:{
			start_date:"",
			due_date:"",
			filter_by_year:false,
			year:0,
			file:"pdf",
			type:"ARRIVALS",
			sort_by:"sales_type",
			hotels:[],
			sale_types: [],
			print_total:false,
			property:null
		},
		options_hotels: [],
		options_sale_types: [],
		options_operation_types: [],
	});

	const [modal_vp_filter_list, setModal_vp_filter_list] = useState({
		open:false,
		params:{
			start_date:"",
			due_date:"",
			file:"pdf",
			type:"",
			refunds_only:false,
			hotels:[],
			sale_types:[],
			representatives:[],
			representative:null
		},
		options_hotels: [],
		options_sale_types: [],
		options_representatives: [],
		options_representatives: [],
		user_extension:null
	});

	const [modal_vp_filter_sap, setModal_vp_filter_sap] = useState({
		open:false,
		params:{
			start_date:"",
			due_date:"",
			date_filter:"",
			title:"",
			transfer_service:false,
			with_out_tax:false,
			sap_codes:"-RCD",
			currency:"USD",
		},
		options_sap_codes: [],
	});

	const handleClose = () => {
        setModal_op_filter_list({
			...modal_op_filter_list,
			open:false,
			property:null,
        });
		setModal_op_filter_coupons({
			...modal_op_filter_coupons,
			open:false,
			property:null,
        });
		setModal_filter_summary({
			...modal_filter_summary,
			open:false,
			property:null,
        });
		setModal_vp_filter_list({
			...modal_vp_filter_list,
			open:false,
			property:null,
        });
		setModal_vp_filter_sap({
			...modal_vp_filter_sap,
			open:false,
			property:null,
        });
	}
	const [isOpen, setIsOpen] = React.useState(false);
	const Handletoggle = () => {
		setIsOpen(!isOpen);
	};

	const [dropdownOpen, setDropdownOpen] = React.useState(false);
	const toggle = () => setDropdownOpen((prevState) => !prevState);
	
	const [dropdownOpenOPReport, setDropdownOpenOPReport] = React.useState(false);
	const toggleOPReport = () => setDropdownOpenOPReport((prevState) => !prevState);

	const [dropdownOpenVPReport, setDropdownOpenVPReport] = React.useState(false);
	const toggleVPReport = () => setDropdownOpenVPReport((prevState) => !prevState);

	const showMobilemenu = () => {
		document.getElementById("sidebarArea").classList.toggle("showSidebar");
	};
  	let location = useLocation();
	const getUserAdminUsers = (user_extension) => {
		let permision = user_extension.permissions.find((permision)=>permision=="GeneralApp.users_management");
		return permision !== undefined;
	}
	const getUserAdminPermisions = (user_extension) => {
		let permision = user_extension.permissions.find((permision)=>permision=="GeneralApp.permission_management");
		return permision !== undefined;
	}

	const getCatalogsPermisions = (user_extension) => {
		let permision = user_extension.permissions.find((permision)=>permision=="GeneralApp.catalogs_management"||permision=="GeneralApp.catalogs_view");
		return permision !== undefined;
	}

	const getUserPermisionsReport = (user_extension,report) => {
		let OperationsAppaccess_report = "OperationsApp.access_"+report;
		let SalesAppaccess_report = "SalesApp.access_"+report;
		let permision = user_extension.permissions.find((permision)=>permision==OperationsAppaccess_report||permision==SalesAppaccess_report);
		return permision !== undefined || user_extension.user.is_superuser == true;
	}
  	return (
		<Navbar color="white" light expand="md" className="fix-header">
			<div className="d-flex align-items-center">
				<div className="d-lg-block d-none me-5 pe-3">
					<Logo />
				</div>
				<NavbarBrand href="/">
					<img src={LogoWhite} alt="Your SVG" className="d-lg-none"/>
				</NavbarBrand>
				<Button
					color="primary"
					className=" d-lg-none"
					onClick={() => showMobilemenu()}>
					<i className="bi bi-list"></i>
				</Button>
			</div>
			<div className="hstack gap-2">
				<Button
					color="primary"
					size="sm"
					className="d-sm-block d-md-none"
					onClick={Handletoggle}>
					{isOpen ? (
						<i className="bi bi-x"></i>
					) : (
						<i className="bi bi-three-dots-vertical"></i>
					)}
				</Button>
			</div>

			<Collapse navbar isOpen={isOpen}>
				<Nav className="me-auto" navbar>
					{getCatalogsPermisions(props.user_extension)?
					<NavItem>
						<Link to="/catalogs"
						className={
						location.pathname === "/catalogs"
							? "active nav-link"
							: "nav-link"
						}
						>
						Catálogos
						</Link>
					</NavItem>:<></>}
					{props.user_extension.has_op_report_access()?
					<NavItem>
						<Dropdown isOpen={dropdownOpenOPReport} toggle={toggleOPReport}>
							<DropdownToggle color="transparent" style={{marginTop:1}}>
								Reportes OP
							</DropdownToggle>
							<DropdownMenu>
								{getUserPermisionsReport(props.user_extension,"op_filter_list")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_op_filter_list({
												...modal_op_filter_list,
												open:true,
											});
										}}>
											<i className={'bi bi-clipboard-fill'}></i>
											<span className="ms-3 d-inline-block">Listas de reporte de operaciones</span>
											
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"op_filter_coupons")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_op_filter_coupons({
												...modal_op_filter_coupons,
												open:true,
											});
										}}>
											<i className={'bi bi-receipt-cutoff'}></i>
											<span className="ms-3 d-inline-block">Cupones de traslados</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"filter_summary")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_filter_summary({
												...modal_filter_summary,
												open:true,
											});
										}}>
											<i className={'bi bi-clipboard-data-fill'}></i>
											<span className="ms-3 d-inline-block">Resumen de operación</span>
									</Link>
								</DropdownItem>:<></>}
							</DropdownMenu>
						</Dropdown>
					</NavItem>
					:<></>}
					{props.user_extension.has_vp_report_access()?
					<NavItem>
						<Dropdown isOpen={dropdownOpenVPReport} toggle={toggleVPReport}>
							<DropdownToggle color="transparent" style={{marginTop:1}}>
								Reportes VP
							</DropdownToggle>
							<DropdownMenu>
								{getUserPermisionsReport(props.user_extension,"by_representative")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"by_representative",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
												
											});
										}}>
										<span className="ms-3 d-inline-block">1. Detalle por representante</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_representatives")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_representatives",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">2. Resumen por representante</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_sales_types_services")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_sales_types_services",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">3. Resumen por Tipo de venta y Servicio</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_services")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_services",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">4. Resumen por servicio</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_hotel")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_hotel",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">5. Resumen por hotel</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"sales_consecutive")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"sales_consecutive",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">6. Consecutivo de cupones</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_representatives_services")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_representatives_services",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">7. Ventas por Tipo de venta, Representante y Servicio</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_sale_types")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_sale_types",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">8. Resumen por Tipo de venta</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"vp_filter_sap")?<>
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_sap({
												...modal_vp_filter_sap,
												open:true,
												params:{
													...modal_vp_filter_sap.params,
													transfer_service:false,
													date_filter:"xFechaVenta",
													title:"Exportar para SAP (Excel)"
												},
												
											});
										}}>
										<span className="ms-3 d-inline-block">9. Exportar para SAP (Excel)</span>
									</Link>
								</DropdownItem>
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_sap({
												...modal_vp_filter_sap,
												open:true,
												params:{
													...modal_vp_filter_sap.params,
													transfer_service:true,
													date_filter:"xFechaVenta",
													title:"Exportar para SAP Transportación (Excel)"
												},
												
											});
										}}>
										<span className="ms-3 d-inline-block">10. Exportar para SAP Transportación (Excel)</span>
									</Link>
								</DropdownItem>
								<DropdownItem >
									<Link onClick={()=>{
											setModal_vp_filter_sap({
												...modal_vp_filter_sap,
												open:true,
												params:{
													...modal_vp_filter_sap.params,
													transfer_service:false,
													date_filter:"xFechaVenta",
													title:"Exportar para SAP Agencia-Ceco (Excel)"
												},
												
											});
										}}>
										<span className="ms-3 d-inline-block">11. Exportar para SAP Agencia-Ceco (Excel)</span>
									</Link>
								</DropdownItem></>:<></>}
								<DropdownItem divider />
								{getUserPermisionsReport(props.user_extension,"report_sale_by_sale_type_and_hotel")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_sale_by_sale_type_and_hotel",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">A. Ventas por Tipo de venta y Hotel</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"report_sale_cost_daily")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_sale_cost_daily",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">B. Detalle Venta y Costo Diario</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"report_refund_by_representatives")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_refund_by_representatives",
													date_filter:"xFechaVenta",
													refunds_only:true,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">F. Cupones Reembolsados</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"report_sales_with_discount")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_sales_with_discount",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">G. Cupones con descuentos</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"report_sales_by_representatives_and_providers")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_sales_by_representatives_and_providers",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">H. Ventas por representante y proveedor</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"report_by_payment_method")||getUserPermisionsReport(props.user_extension,"report_by_payment_method_sales")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_by_payment_method",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">I. Cupones x Rep. y F. Pago</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"report_sales_pax_by_services")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"report_sales_pax_by_services",
													date_filter:"xFechaServicio",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">J. Lista de Pax por excursión</span>
									</Link>
								</DropdownItem>:<></>}
								{getUserPermisionsReport(props.user_extension,"summary_by_providers_services")?
								<DropdownItem>
									<Link onClick={()=>{
											setModal_vp_filter_list({
												...modal_vp_filter_list,
												open:true,
												params:{
													...modal_vp_filter_list.params,
													type:"summary_by_providers_services",
													date_filter:"xFechaVenta",
													refunds_only:false,
												},
												user_extension:props.user_extension
											});
										}}>
										<span className="ms-3 d-inline-block">K. Ventas x Agencia, Proveedor y Servicio</span>
									</Link>
								</DropdownItem>:<></>}
							</DropdownMenu>
						</Dropdown>
					</NavItem>
					:<></>}
				</Nav>
				<div>
					<h5 style={{textAlign:'right'}}>{props.user_extension.id?props.user_extension.user.username:""}</h5>
					<h6 className="text-muted text-properties"style={{maxWidth:"600px"}} >{props.user_extension.id?props.user_extension.properties.map((property)=>property.name).join(','):""}</h6>
				</div>
				<Dropdown isOpen={dropdownOpen} toggle={toggle}>
				<DropdownToggle color="transparent">
					<img
						src={user1}
						alt="profile"
						className="rounded-circle"
						width="30"
					></img>
				</DropdownToggle>
				<DropdownMenu>
					{props.user_extension.id?<>
						<DropdownItem header>Info</DropdownItem>
						{getUserAdminUsers(props.user_extension)?
							<Link to={"/user_admin/"}><DropdownItem>Administración de usuarios</DropdownItem></Link>
							:<></>
						}
						{getUserAdminPermisions(props.user_extension)?
							<Link to={"/permission_groups/"}><DropdownItem>Administración de permisos</DropdownItem></Link>
							:<></>
						}
						{props.user_extension.user.is_superuser?
							<Link to={"/requests/"}><DropdownItem>Consultas al api</DropdownItem></Link>
							:<></>
						}
						<Link to={"/profile/"}><DropdownItem>Perfil</DropdownItem></Link>
						<DropdownItem divider />
					</>
					:<></>}
					<DropdownItem>
						<a href="/logout/">
							Cerrar sesión
						</a>
					</DropdownItem>
				</DropdownMenu>
				</Dropdown>
			</Collapse>
			<ModalOperationFilterListReport handleClose={handleClose} data={modal_op_filter_list}/>
			<ModalOperationFilterCouponReport handleClose={handleClose} data={modal_op_filter_coupons}/>
			<ModalOperationFilterSummary handleClose={handleClose} data={modal_filter_summary}/>
			<ModalSaleFilterListReport handleClose={handleClose} data={modal_vp_filter_list}/>
			<ModalSaleFilterSapReport handleClose={handleClose}	data={modal_vp_filter_sap}/>
		</Navbar>
  );
};

export default Header;
