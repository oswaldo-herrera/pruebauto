import { Button, Nav, NavItem, NavLink, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import ModalOperationFilterListReport from "../components/operation/ModalOperationFilterListReport";

const navigation = [
  {
    title: "VP-Ventas",
    icon: "bi bi-shop",
    children:[
      {
        title: "Ventas",
        href: "/sales",
        icon: "bi bi-cash-coin",
      },
      {
        title: "Cierres de disponibilidad",
        href: "/allotments",
        icon: "bi bi-calendar2-x-fill",
      },
      {
        title: "Operaciones VP",
        href: "/operations_vp",
        icon: "bi bi-bus-front",
      },
    ]
  },
  {
    title: "Operación",
    icon: "bi bi-ticket-perforated",
    children:[
      {
        title: "Pick Up",
        href: "/pick_ups",
        icon: "bi bi-sign-stop-fill",
      },
      {
        title: "Vuelos",
        href: "/flights",
        icon: "bi bi-airplane-fill",
      },
      {
        title: "Reservaciones",
        href: "/reservations",
        icon: "bi bi-briefcase-fill",
      },
      {
        title: "Operaciones",
        href: "/operations",
        icon: "bi bi-bus-front",
      },
      {
        title: "Facturas de Prov",
        href: "/provider_costs",
        icon: "bi bi-receipt",
      },
    ]
  },
  /* {
    title: "Monedero",
    href: "/store_cards",
    icon: "bi bi-credit-card-2-front-fill",
  },
  {
    title: "Buttons",
    href: "/buttons",
    icon: "bi bi-hdd-stack",
  },
  {
    title: "Cards",
    href: "/cards",
    icon: "bi bi-card-text",
  },
  {
    title: "Grid",
    href: "/grid",
    icon: "bi bi-columns",
  },
  {
    title: "Table",
    href: "/table",
    icon: "bi bi-layout-split",
  },
  {
    title: "Forms",
    href: "/forms",
    icon: "bi bi-textarea-resize",
  },
  {
    title: "Breadcrumbs",
    href: "/breadcrumbs",
    icon: "bi bi-link",
  },
  {
    title: "About",
    href: "/about",
    icon: "bi bi-people",
  }, */
];

const Sidebar = () => {
  	const showMobilemenu = () => {
    	document.getElementById("sidebarArea").classList.toggle("showSidebar");
  	};
  	let location = useLocation();

  return (
    <div className="bg-dark">
      	<div className="d-flex">
			<Button color="white"
				className="ms-auto text-white d-lg-none"
				onClick={() => showMobilemenu()}>
				<i className="bi bi-x"></i>
			</Button>
      	</div>
      	<div className="p-3 mt-2">
        	<Nav vertical className="sidebarNav">
          		{navigation.map((navi, index) => (
            		navi.children?
                <UncontrolledDropdown nav inNavbar>
                  <DropdownToggle nav caret color="dark">
                    <i className={navi.icon} style={{marginRight:15}}></i> 
                      {navi.title}
                  </DropdownToggle>
                  <DropdownMenu dark end>
                  {navi.children.map((child, i) => (
                    <DropdownItem key={i}>
                      <Link to={child.href}
                        className={
                          location.pathname === child.href
                            ? "active nav-link py-3"
                            : "nav-link py-3"
                        }>
                        <i className={child.icon}></i>
                        <span className="ms-3 d-inline-block">{child.title}</span>
                      </Link>
                    </DropdownItem>
                  ))}
                  </DropdownMenu>
                </UncontrolledDropdown>
            		:
                <NavItem key={index} className="sidenav-bg">
                  <Link to={navi.href}
                    className={
                      location.pathname === navi.href
                        ? "active nav-link py-3"
                        : "nav-link py-3"
                    }>
                      <i className={navi.icon}></i>
                      <span className="ms-3 d-inline-block">{navi.title}</span>
                  </Link>
                </NavItem>
          		))}
        	</Nav>
      	</div>
    </div>
  );
};

export default Sidebar;
