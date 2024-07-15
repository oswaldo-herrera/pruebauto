import { lazy } from "react";
import AvailabilityGroupForm from "./components/catalog/AvailabilityGroupForm.js";
import FlightList from "./components/operation/FlightList.js";
import OperationList from "./components/operation/OperationList.js";
import OperationListVP from "./components/sale/OperationListVP.js";
import PickUpList from "./components/operation/PickUpList.js";
import ReservationList from "./components/operation/ReservationList.js";
import AllotmentList from "./components/sale/AllotmentList.js";
import StoreCardList from "./components/sale/StoreCardList.js";
import InvoiceOperationProvider from "./components/invoice/InvoiceOperationProvider.js";
import RequestList from "./components/user/RequestList.js";
import ProtectedRoutes from "./ProtectedRoutes.js";
import Buttons from "./views/ui/Buttons.js";
import SaleTokenForm from "./components/sale/sale_token/SaleTokenForm.js";

//import { CatalogList } from "./views/CatalogList.js";

/****Layouts*****/
const FullLayout = lazy(() => import("./layouts/FullLayout.js"));
const CustomLayout = lazy(() => import("./layouts/CustomLayout.js"));

/***** Pages ****/

const Starter = lazy(() => import("./views/Starter.js"));
const Catalog = lazy(() => import("./views/Catalog.js"));

const SimpleForm = lazy(() => import("./components/catalog/SimpleForm.js"));
const StoreForm = lazy(() => import("./components/catalog/StoreForm.js"));
const DepartmentCECOSForm = lazy(() => import("./components/catalog/DepartmentCECOSForm.js"));
const ExchangeRateForm = lazy(() => import("./components/catalog/ExchangeRateForm.js"));
const CoordinatorsComissionForm = lazy(() => import("./components/catalog/CoordinatorsComissionForm.js"));
const SaleTypeForm = lazy(() => import("./components/catalog/SaleTypeForm.js"));
const HotelForm = lazy(() => import("./components/catalog/HotelForm.js"));
const ServiceForm = lazy(() => import("./components/catalog/ServiceForm.js"));
const PaymentMethodForm = lazy(() => import("./components/catalog/PaymentMethodForm.js"));
const PaymentTypeForm = lazy(() => import("./components/catalog/PaymentTypeForm.js"));
const ClientTypeForm = lazy(() => import("./components/catalog/ClientTypeForm.js"));
const RepresentativeForm = lazy(() => import("./components/catalog/RepresentativeForm.js"));
const ProviderForm = lazy(() => import("./components/catalog/ProviderForm.js"));
const DiscountForm = lazy(() => import("./components/catalog/DiscountForm.js"));
const UnitForm = lazy(() => import("./components/catalog/UnitForm.js"));
const UserList = lazy(() => import("./components/user/UserList.js"));
const UserForm = lazy(() => import("./components/user/UserForm.js"));
const GroupPermissionList = lazy(() => import("./components/user/GroupPermissionList.js"));
const GroupPermissionForm = lazy(() => import("./components/user/GroupPermissionForm.js"));
const ProfileForm = lazy(() => import("./components/user/ProfileForm.js"));
const FlightForm = lazy(() => import("./components/operation/FlightForm.js"));
const PickUpForm = lazy(() => import("./components/operation/PickUpForm.js"));
const ReservationForm = lazy(() => import("./components/operation/ReservationForm.js"));
const ReservationTokenForm = lazy(() => import("./components/operation/reservation_token/ReservationTokenForm.js"));
const SaleForm = lazy(() => import("./components/sale/SaleForm.js"));
const SaleList = lazy(() => import("./components/sale/SaleList.js"));
const StoreCardForm = lazy(() => import("./components/sale/StoreCardForm.js"));


/*****Routes******/
const datosSesion = window.datosSesion;
const ThemeRoutes = [
  {
    path: "/",
    element: <ProtectedRoutes />,
    children: [
      { path: "/", exact: true, element: <Starter /> },
      { path: "/catalogs", exact: true, element: <Catalog table="" />},
      { path: "/catalogs/units", exact: true, element: <Catalog table="units" />},
      { path: "/catalogs/unit/", exact: true, element: <UnitForm />},
      { path: "/catalogs/unit/:id", exact: true, element: <UnitForm />},
      { path: "/catalogs/hotels", exact: true, element: <Catalog table="hotels" />},
      { path: "/catalogs/hotel/", exact: true, element: <HotelForm />},
      { path: "/catalogs/hotel/:id", exact: true, element: <HotelForm />},
      { path: "/catalogs/groups", exact: true, element: <Catalog table="groups" />},
      { path: "/catalogs/group/", exact: true, element: <SimpleForm model={{url:'general/groups',react_url:'groups',name:'group'}} type='properties' filter="VP"/>},
      { path: "/catalogs/group/:id", exact: true, element: <SimpleForm model={{url:'general/groups',react_url:'groups',name:'group'}} type='properties' filter="VP"/>},
      { path: "/catalogs/services", exact: true, element: <Catalog table="services" />},
      { path: "/catalogs/service/", exact: true, element: <ServiceForm />},
      { path: "/catalogs/service/:id", exact: true, element: <ServiceForm />},
      { path: "/catalogs/saletypes", exact: true, element: <Catalog table="saletypes" />},
      { path: "/catalogs/saletype/", exact: true, element: <SaleTypeForm />},
      { path: "/catalogs/saletype/:id", exact: true, element: <SaleTypeForm />},
      { path: "/catalogs/providers", exact: true, element: <Catalog table="providers" />},
      { path: "/catalogs/provider/", exact: true, element: <ProviderForm />},
      { path: "/catalogs/provider/:id", exact: true, element: <ProviderForm />},
      { path: "/catalogs/sale_logs", exact: true, element: <Catalog table="sale_logs" />},
      { path: "/catalogs/discounts", exact: true, element: <Catalog table="discounts" />},
      { path: "/catalogs/discount/", exact: true, element: <DiscountForm />},
      { path: "/catalogs/discount/:id", exact: true, element: <DiscountForm />},
      { path: "/catalogs/auth_discounts", exact: true, element: <Catalog table="auth_discounts" />},
      { path: "/catalogs/reservation_logs", exact: true, element: <Catalog table="reservation_logs" />},
      { path: "/catalogs/contacts", exact: true, element: <Catalog table="contacts" />},
      { path: "/catalogs/contact/", exact: true, element: <SimpleForm model={{url:'operations/contacts',react_url:'contacts',name:'contact'}} type='properties' filter="OP"/>},
      { path: "/catalogs/contact/:id", exact: true, element: <SimpleForm model={{url:'operations/contacts',react_url:'contacts',name:'contact'}} type='properties' filter="OP"/>},
      { path: "/catalogs/unit_types", exact: true, element: <Catalog table="unit_types" />},
      { path: "/catalogs/unit_type/", exact: true, element: <SimpleForm model={{url:'general/unit_types',react_url:'unit_types', name:'unit_type'}} type='property' filter="OP"/>},
      { path: "/catalogs/unit_type/:id", exact: true, element: <SimpleForm model={{url:'general/unit_types',react_url:'unit_types', name:'unit_type'}} type='property' filter="OP"/>},
      { path: "/catalogs/activities", exact: true, element: <Catalog table="activities" />},
      { path: "/catalogs/activity/", exact: true, element: <SimpleForm model={{url:'general/activities',react_url:'activities',name:'activity'}} type='properties'/>},
      { path: "/catalogs/activity/:id", exact: true, element: <SimpleForm model={{url:'general/activities',react_url:'activities',name:'activity'}} type='properties'/>},
      { path: "/catalogs/client_types", exact: true, element: <Catalog table="client_types" />},
      { path: "/catalogs/client_type/", exact: true, element: <ClientTypeForm />},
      { path: "/catalogs/client_type/:id", exact: true, element: <ClientTypeForm />},
      { path: "/catalogs/payment_types", exact: true, element: <Catalog table="payment_types" />},
      { path: "/catalogs/payment_type/", exact: true, element: <PaymentTypeForm />},
      { path: "/catalogs/payment_type/:id", exact: true, element: <PaymentTypeForm />},
      { path: "/catalogs/exchangerates", exact: true, element: <Catalog table="exchangerates" />},
      { path: "/catalogs/exchangerate/", exact: true, element: <ExchangeRateForm />},
      { path: "/catalogs/exchangerate/:id", exact: true, element: <ExchangeRateForm />},
      { path: "/catalogs/operation_types", exact: true, element: <Catalog table="operation_types" />},
      { path: "/catalogs/operation_type/", exact: true, element: <SimpleForm model={{url:'general/operation_types',react_url:'operation_types',name:'operation_type'}} type='properties'/>},
      { path: "/catalogs/operation_type/:id", exact: true, element: <SimpleForm model={{url:'general/operation_types',react_url:'operation_types',name:'operation_type'}} type='properties'/>},
      { path: "/catalogs/business_groups", exact: true, element: <Catalog table="business_groups" />},
      { path: "/catalogs/business_group/", exact: true, element: <SimpleForm model={{url:'general/business_groups',react_url:'business_groups', name:'business_group'}} type='properties'/>},
      { path: "/catalogs/business_group/:id", exact: true, element: <SimpleForm model={{url:'general/business_groups',react_url:'business_groups', name:'business_group'}} type='properties'/>},
      { path: "/catalogs/payment_methods", exact: true, element: <Catalog table="payment_methods" />},
      { path: "/catalogs/payment_method/", exact: true, element: <PaymentMethodForm />},
      { path: "/catalogs/payment_method/:id", exact: true, element: <PaymentMethodForm />},
      { path: "/catalogs/representatives", exact: true, element: <Catalog table="representatives" />},
      { path: "/catalogs/representative/", exact: true, element: <RepresentativeForm />},
      { path: "/catalogs/representative/:id", exact: true, element: <RepresentativeForm />},
      { path: "/catalogs/departmentscecos", exact: true, element: <Catalog table="departmentscecos" />},
      { path: "/catalogs/departmentcecos/", exact: true, element: <DepartmentCECOSForm />},
      { path: "/catalogs/departmentcecos/:id", exact: true, element: <DepartmentCECOSForm />},
      { path: "/catalogs/availability_groups", exact: true, element: <Catalog table="availability_groups" />},
      { path: "/catalogs/availability_group/", exact: true, element: <AvailabilityGroupForm />},
      { path: "/catalogs/availability_group/:id", exact: true, element: <AvailabilityGroupForm />},
      { path: "/catalogs/coordinators_comissions", exact: true, element: <Catalog table="coordinators_comissions" />},
      { path: "/catalogs/coordinators_comission/", exact: true, element: <CoordinatorsComissionForm />},
      { path: "/catalogs/coordinators_comission/:id", exact: true, element: <CoordinatorsComissionForm />},
      /* Administración de usuarios */
      { path: "/user_admin", exact: true, element: <UserList />},
      { path: "/user_extension/", exact: true, element: <UserForm />},
      { path: "/user_extension/:id", exact: true, element: <UserForm />},
      { path: "/permission_groups", exact: true, element: <GroupPermissionList />},
      { path: "/permission_group/", exact: true, element: <GroupPermissionForm />},
      { path: "/permission_group/:id", exact: true, element: <GroupPermissionForm />},
      { path: "/profile/", exact: true, element: <ProfileForm />},
      { path: "/requests", exact: true, element: <RequestList />},
      /* Operaciones */
      { path: "/reservations/", exact: true, element: <ReservationList />},
      { path: "/reservation/", exact: true, element: <ReservationForm />},
      { path: "/reservation/:id", exact: true, element: <ReservationForm />},
      { path: "/flights", exact: true, element: <FlightList />},
      { path: "/flight/", exact: true, element: <FlightForm />},
      { path: "/flight/:id", exact: true, element: <FlightForm />},
      { path: "/pick_ups", exact: true, element: <PickUpList />},
      { path: "/pick_up/", exact: true, element: <PickUpForm />},
      { path: "/pick_up/:id", exact: true, element: <PickUpForm />},
      { path: "/operations/", exact: true, element: <OperationList />},
      /* Ventas */
      { path: "/sales/", exact: true, element: <SaleList />},
      { path: "/sale/", exact: true, element: <SaleForm reserved={false} />},
      { path: "/sale_reserved/", exact: true, element: <SaleForm reserved={true} />},
      { path: "/sale/:id", exact: true, element: <SaleForm reserved={false}/>},
      { path: "/allotments/", exact: true, element: <AllotmentList />},
      { path: "/store_cards/", exact: true, element: <StoreCardList />},
      { path: "/store_card/", exact: true, element: <StoreCardForm />},
      { path: "/store_card/:id", exact: true, element: <StoreCardForm />},
      { path: "/operations_vp/", exact: true, element: <OperationListVP />},
      /* Facturacion */
      { path: "/provider_costs", exact: true, element: <InvoiceOperationProvider />},
    ],
  },
  {
    path: "/reservation_page",
    element: <CustomLayout />,
    children:[
      { path: "create/", exact: true, element: <ReservationTokenForm />},
      { path: "update/:id", exact: true, element: <ReservationTokenForm />},
    ]
  },
  {
    path: "/sale_page",
    element: <CustomLayout />,
    children:[
      { path: "", exact: true, element: <SaleTokenForm />},
      { path: ":id", exact: true, element: <SaleTokenForm />},
    ]
  },
];

export default ThemeRoutes;