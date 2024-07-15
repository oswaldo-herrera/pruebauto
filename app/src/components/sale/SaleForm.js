import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, ButtonGroup, Table, InputGroup, InputGroupText, Badge, FormFeedback } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { Sale, SalePayment, createSale, updateSale, getSale, sendSaleEmail } from './SaleModel';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import { getProfile, Profile, User } from '../user/UserModel';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import ModalSalePayment from './ModalSalePayment';
import ModalServiceData from './ModalServiceData';
import ModalReservationSaleAsignment from './ModalReservationSaleAsignment';
import ModalDiscountAuthozation from './ModalDiscountAuthozation';
class SaleForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeValueRadioType = this.onChangeValueRadioType.bind(this);
        this.onChangeValueRadioTypeServiceFee = this.onChangeValueRadioTypeServiceFee.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSubmitReservationToSale = this.handleSubmitReservationToSale.bind(this);
        this.state={
            id: null,
            sale: new Sale({
                id:null,
                status:"A",
                name_pax:"",
                email:"",
                sale_service_fee:false,
                service_fee:20,
                user_extension:null,
                user_extension_name:"",
                sale_key:null,
                sale_reservation_id:0,
                reservation_service:null,
                service:null,
                service_data:"",
                service_date:"",
                service_rate:null,
                service_rate_data:null,
                schedule:null,
                schedule_data:null,
                schedule_time:"",
                schedule_max:0,
                schedule_reserved:0,
                time:null,
                address:"",
                sale_date:"",
                sale_type:null,
                sale_type_data:null,
                client_type:null,
                client_type_data:null,
                adults:0,
                childs:0,
                discount_type:"amount",
                discount:0,
                overcharged:0,
                hotel:null,
                hotel_name:"",
                room:"",
                confirm_provider:"",
                comments:"",
                comments_coupon: "",
                property:null,
                sale_payments:[]
            }),
            adult_price:0,
            adult_total:0,
            child_price:0,
            child_total:0,
            sale_total:0,
            sale_balance:false,
            sale_payments_amount:0,
            reserved_to_sale:false,
            reservation_to_sale_process:false,
            reservation_sales:[],
            exchange_rate:null,
            service_date_original:"",
            options_services: [],
            options_hotels: [],
            options_sale_types: [],
            options_client_types: [],
            options_schedules: [],
            options_schedule_pickups: [],
            options_representatives: [],
            options_payment_methods: [],
            payment_method_service_fee: null,
            sale_request:false,
            discount_no_auth:null,
            discount_auth:null,
            user_extension:new Profile({
                id:null,
                user: new User(null,"","","","","",false,false),
                properties:[],
                permissions:[]
            }),
            modal:{
                title: "Venta",
                type: 'success',
                message: null,
            },
            modal_payment:{
                sale_payment:null,
            },
            modal_discount:{
                open:false,
                discount_key:"",
                property:null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                value:null
            },
            modal_reservation_sales:{
                open:false,
                reservation_id:"",
                property:null,
            },
            modal_service:{
                open:false,
                id:null,
                sale_date:"",
            },
        }
    }

    onChangeValue(event) {
        let value = event.target.value;
		this.setState(function (prevState) {
			return {
				sale: {
					...prevState.sale,
                    [event.target.name]:value,
				},
			};
		},()=>{
            if(event.target.name==="adults"||event.target.name==="childs"){
                let reserved = parseInt(this.state.sale.schedule_reserved?this.state.sale.schedule_reserved:0) + parseInt(this.state.sale.adults) + parseInt(this.state.sale.childs);
                if(this.state.sale.time!==null&&reserved>this.state.sale.schedule_max){
                    let exceeded = reserved - this.state.sale.schedule_max;
                    this.setState(function (prevState) {
                        return {
                            sale: {
                                ...prevState.sale,
                                [event.target.name]:this.state.sale[event.target.name] - exceeded
                            },
                        };
                    },()=>{
                        alert("No hay espacio disponible para el pax asignado.");
                        this.sale_total_balance();
                    });
                } else {
                    this.sale_total_balance();
                }
            }
            if(event.target.name==="service_date"){
                this.setState(function (prevState) {
                    return {
                        sale: {
                            ...prevState.sale,
                            service_rate:null,
                            service_rate_data:null,
                            schedule:null,
                            schedule_time:"",
                            schedule_max:0,
                            schedule_reserved:0,
                            time:null,
                        },
                    };
                },()=>{
                    this.options_load();
                    this.service_sale_details();
                });
            } else if(event.target.name==="discount"){
                let discount_no_auth_discount = this.state.discount_no_auth?this.state.discount_no_auth.discount:0
                if(this.state.discount_auth===null&&discount_no_auth_discount<this.state.sale.discount){
                    if(window.confirm(`¿Desea agregar descuento?`)){
                        this.setState(function (prev_State) {
                            return {
                                modal_discount:{
                                    ...prev_State.modal_discount,
                                    open:true,
                                    discount_key:"",
                                }
                            };
                        });
                    } else {
                        this.setState(function (prev_State) {
                            return {
                                sale:{
                                    ...prev_State.sale,
                                    discount:0
                                }
                            };
                        },()=>{
                            this.get_discount();
                            this.service_sale_details();
                        });
                    }
                } else {
                    this.sale_total_balance();
                }
                
            } else if(event.target.name==="overcharged"){
                this.sale_total_balance();
            }
        });
    }

    onChangeValueRadioType(event) {
        this.setState(function (prevState) {
            return {
                sale: {
                    ...prevState.sale,
                    discount_type:event.target.value,
                    discount:0
                },
                discount_no_auth:null
            };
        },()=>{
            this.sale_total_balance()
        });
    }

    onChangeValueRadioTypeServiceFee(event) {
        this.setState(function (prevState) {
            return {
                sale: {
                    ...prevState.sale,
                    service_fee:parseFloat(event.target.value),
                },
            };
        },()=>{
            this.sale_total_balance()
        });
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
                sale: {
                    ...prevState.sale,
                    [event.name]:value,
                },
		    };
		},()=>{
            if(event.name==="client_type"){
                this.setState(function (prevState) {
                    return {
                        sale: {
                            ...prevState.sale,
                            client_type_data:data?data.data:null,
                        },
                    };
                },()=>{
                    this.get_discount();
                    this.service_sale_details();
                });
            }
            if(event.name==="service"){
                this.setState(function (prevState) {
                    return {
                        sale: {
                            ...prevState.sale,
                            service_data:data?data.data:null,
                            service_rate:null,
                            service_rate_data:null,
                            schedule:null,
                            schedule_time:"",
                            schedule_max:0,
                            schedule_reserved:0,
                            time:null,
                        },
                    };
                },()=>{
                    this.get_discount();
                    this.service_sale_details();
                });
            }
            if(event.name==="schedule"){
                let schedule=value,
                    schedule_time=data?data.label:"",
                    schedule_reserved=data?data.reserved:0,
                    schedule_max=data?data.limit:0,
                    reserved = parseInt(schedule_reserved) + parseInt(this.state.sale.adults) + parseInt(this.state.sale.childs),
                    options_schedule_pickups = data?data.pick_ups:[];
                if(this.state.sale.id!==null){
                    if(reserved>schedule_max && schedule !== null){
                        schedule=null;
                        schedule_time="";
                        schedule_max=0;
                        schedule_reserved=0;
                        alert("No hay espacio disponible para el pax asignado.");
                    }
                    this.setState(function (prevState) {
                        return {
                            sale: {
                                ...prevState.sale,
                                schedule:schedule,
                                schedule_time:schedule_time,
                                schedule_reserved:schedule_reserved,
                                schedule_max:schedule_max,
                                time:schedule_time,
                            },
                            options_schedule_pickups:options_schedule_pickups
                        };
                    });
                } else {
                    let adults = this.state.sale.adults,
                        childs = this.state.sale.childs;
                    if(reserved>schedule_max){
                        adults = 0;
                        childs = 0;
                        alert("No hay espacio disponible para el pax asignado.");
                    }
                    this.setState(function (prevState) {
                        return {
                            sale: {
                                ...prevState.sale,
                                adults:adults,
                                childs:childs,
                                schedule_time:schedule_time,
                                schedule_reserved:schedule_reserved,
                                schedule_max:schedule_max,
                                time:schedule_time,
                            },
                            options_schedule_pickups:options_schedule_pickups
                        };
                    },()=>this.sale_total_balance());
                }
            }
            if(event.name==="sale_type"){
                this.setState(function (prevState) {
                    return {
                        sale: {
                            ...prevState.sale,
                            sale_type_data:data?data.data:null,
                        },
                    };
                },()=>{
                    this.get_discount();
                    this.service_sale_details();
                });
                this.options_load();
            }
        });
    }

    handleSubmitReservationToSale(e){
        e.preventDefault();
        this.setState({
            sale_request:true,
            reserved_to_sale:false,
        });
        createSale(this.state.sale,this.state.discount_auth).then(res => {
            if(res.email !== "" && res.email !== null && res.status === "A"){
                if(window.confirm(`¿Desea enviar este cupon de venta por correo?`)){
                    sendSaleEmail(res.id).then(res => {
                        let emails = res.email.split(";"),
                            text = "";
                        emails.forEach(email => {
                            text += "\n -" + email
                        });
                        alert("Se ha enviado el correo a:" + text);
                    });
                }
            }
            if(this.state.reservation_sales.length>0){
                this.openSale(`/sale/${res.id}/`);
                this.openSale(`${ApiSalesUrl}print_sale/${res.id}/?create=true`);
                this.handleAsignSaleFromList()
            } else {
                this.reset(res.id, false);
                this.setState(function (prev_State) {
                    return {
                        modal: {
                            ...prev_State.modal,
                            type:"success",
                            message: "¡Guardado exitoso!",
                        },
                    };
                });
                this.props.history('/sale/'+res.id);
                this.openSale(`${ApiSalesUrl}print_sale/${res.id}/?create=true`);
                this.setState({
                    reservation_to_sale_process:false,
                });
            }
        }).catch(error => {
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.error,
                    },
                };
            });
        }).finally(()=>this.setState({sale_request:false}));
    }

    async handleSubmit(e){
        e.preventDefault();
        var sale_service_fee = null;
        if (this.state.id !== null) {
            if(this.state.reserved_to_sale){
                sale_service_fee = this.new_sale_service_fee(this.state.sale);
                if(sale_service_fee!==null){
                    let success = await this.updateSaleModel(this.state.id, this.state.sale, true);
                    if(success){
                        this.setState(
                            (prev_State) =>{
                            return {
                                id:null,
                                sale:new Sale(sale_service_fee),
                                discount_auth: null,
                                discount_no_auth: null,
                                modal_properties: {
                                    ...prev_State.modal_properties,
                                    data:sale_service_fee.property,
                                },
                                modal_payment: {
                                    ...prev_State.modal_payment,
                                    property:sale_service_fee.property
                                },
                            };
                        },()=>{
                            this.options_load();
                            this.service_sale_details();
                        });
                    }
                } else if(this.state.sale.status !== "C"){
                    this.updateSaleModel(this.state.id, this.state.sale);
                }
            } else if(this.state.sale.status !== "C"){
                this.updateSaleModel(this.state.id, this.state.sale);
            } else {
                window.alert("No se puede modificar una venta cancelada");
            }
        } else {
            sale_service_fee = this.new_sale_service_fee(this.state.sale);
            if(sale_service_fee!==null&&this.state.sale.status==="A"){
                let success = await this.createSaleModel(this.state.sale, true);
                if(success){
                    this.setState(
                        (prev_State) =>{
                        return {
                            id:null,
                            sale:new Sale(sale_service_fee),
                            discount_auth: null,
                            discount_no_auth: null,
                            modal_properties: {
                                ...prev_State.modal_properties,
                                data:sale_service_fee.property,
                            },
                            modal_payment: {
                                ...prev_State.modal_payment,
                                property:sale_service_fee.property
                            },
                        };
                    },()=>{
                        this.options_load();
                        this.service_sale_details();
                    });
                }
            } else {
                this.createSaleModel(this.state.sale);
            }    
        }
    }

    createSaleModel(sale,new_sale=false){
        this.setState({
            sale_request:true,
            reserved_to_sale:false,
        });
        return new Promise((resolve)=> {
            createSale(sale,this.state.discount_auth).then(res => {
                if(res.email !== "" && res.email !== null && res.status === "A"){
                    if(window.confirm(`¿Desea enviar este cupon de venta por correo?`)){
                        sendSaleEmail(res.id).then(res => {
                            let emails = res.email.split(";"),
                                text = "";
                            emails.forEach(email => {
                                text += "\n -" + email
                            });
                            alert("Se ha enviado el correo a:" + text);
                        });
                    }
                }
                if(new_sale){
                    this.openSale(`/sale/${res.id}/`);
                    if(res.status === "A"){
                        this.openSale(`${ApiSalesUrl}print_sale/${res.id}/?create=true`);
                    }      
                } else {
                    this.reset(res.id, false);
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Guardado exitoso!",
                            },
                        };
                    });
                    this.props.history('/sale/'+res.id)
                    if(res.status === "A"){
                        this.openSale(`${ApiSalesUrl}print_sale/${res.id}/?create=true`);
                    }
                }
                resolve(true);
            }).catch(error => {
                this.setState(function (prev_State) {
                    return {
                        modal: {
                            ...prev_State.modal,
                            type:"error",
                            message: error.response.data.error,
                        },
                    };
                });
                resolve(false);
            }).finally(()=>this.setState({sale_request:false}));
        });
    }

    updateSaleModel(id, sale,new_sale=false){
        this.setState({
            sale_request:true,
        });
        return new Promise((resolve)=> {
            updateSale(id, sale, this.state.discount_auth).then(res => {
                if(res.email !== "" && res.email !== null && res.status === "A" && this.state.reserved_to_sale){
                    this.setState({
                        reserved_to_sale:false,
                    });
                    if(window.confirm(`¿Desea enviar este cupon de venta por correo?`)){
                        sendSaleEmail(res.id).then(res => {
                            let emails = res.email.split(";"),
                                text = "";
                            emails.forEach(email => {
                                text += "\n -" + email
                            });
                            alert("Se ha enviado el correo a:" + text);
                        });
                    }
                    if(res.status === "A"){
                        this.openSale(`${ApiSalesUrl}print_sale/${res.id}/?create=true`);
                    }
                }
                if(new_sale){
                    this.openSale(`/sale/${res.id}/`);
                    if(res.status === "A"){
                        this.openSale(`${ApiSalesUrl}print_sale/${res.id}/?create=true`);
                    } 
                } else {
                    this.reset(res.id, false);
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                            old_sale:null
                        };
                    });
                }
                resolve(true);
            }).catch(error => {
                this.catchError(error);
                resolve(false);
            }).finally(()=>this.setState({sale_request:false}));
        });
    }

    catchError(error){
        if(error.response.status == 500){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: "Error interno de servidor: contacte al administrador del sistema para continuar",
                    },
                };
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.error,
                    },
                };
            });
        }
    }

    openSale(url){
        try {
            window.open(url, "_blank");
        } catch (exception) {
            console.log(exception);
        }
    }

    new_sale_service_fee(sale){
        if (sale.sale_service_fee === false && sale.sale_type_data.is_service_fee === true && sale.service_data.service_fee !== null){
            var adult_price = sale.service_rate_data.adult_price
            var child_price = sale.service_rate_data.child_price
            if (sale.service_rate_data.currency === "MN"){
                adult_price = adult_price/this.state.exchange_rate.usd_currency
                child_price = child_price/this.state.exchange_rate.usd_currency
            } else if (sale.service_rate_data.currency === "EURO"){
                adult_price = (adult_price*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency
                child_price = (child_price*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency
            }
            var sale_total = (adult_price*sale.adults) + (child_price*sale.childs)
            var discount = sale.discount
            if (sale.discount_type === "percent")
                discount = (discount/ 100) * sale_total
            sale_total = sale_total + (sale.overcharged - discount)
            adult_price = sale.service_fee/100;
            child_price = 0;
            let payment_total = 0
            for (let index = 0; index < sale.sale_payments.length; index++) {
                const sale_payment = sale.sale_payments[index];
                if(sale_payment.payment_method_data.payment_type_name === "RC / RCC"){
                    payment_total += sale_payment.amount;
                }
            }
            let sale_payment_amount = (adult_price*payment_total) + (child_price*payment_total);
            if(this.state.payment_method_service_fee.data.currency === "MN"){
                sale_payment_amount = sale_payment_amount/this.state.exchange_rate.usd_currency;
            } else if(this.state.payment_method_service_fee.data.currency === "EURO"){
                sale_payment_amount = (sale_payment_amount*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency;
            }
            var sale_payment = new SalePayment({
                id:null,
                sale:null,
                authorization:"",
                amount:sale_payment_amount.toFixed(2),
                department_cecos:null,
                department_cecos_data:null,
                payment_method:this.state.payment_method_service_fee.data.id,
                payment_method_data:this.state.payment_method_service_fee.data,
            })
            return {
                id:null,
                status:"A",
                sale_key:"",
                sale_key_manual:0,
                sale_reservation_id:0,
                reservation_service:null,
                email:sale.email,
                name_pax:sale.name_pax,
                user_extension:sale.user_extension,
                user_extension_name:sale.user_extension_name,
                representative:sale.representative,
                representative_name:sale.representative_name,
                service:sale.service_data.service_fee,
                service_data:sale.service_data.service_fee_data,
                sale_date:sale.sale_date,
                service_date:sale.service_date,
                service_rate:null,
                service_rate_data:null,
                schedule:null,
                schedule_time:"",
                schedule_max:0,
                schedule_reserved:0,
                time:null,
                hotel:sale.hotel,
                hotel_name:sale.hotel_name,
                sale_service_fee:true,
                service_fee:sale.service_fee,
                sale_type:sale.sale_type,
                sale_type_data:sale.sale_type_data,
                adults:payment_total.toFixed(2),
                childs:0,
                discount_type:"amount",
                discount:0,
                overcharged:0,
                room:sale.room,
                client_type:sale.client_type,
                client_type_data:sale.client_type_data,
                confirm_provider:"",
                comments:"",
                comments_coupon:"",
                property:sale.property,
                property_name:sale.property_name,
                sale_payments:[sale_payment,]
            }
        }
        return null
    }

    componentDidMount() {
        console.log(this.props.params)
        let id = this.props.params.id?this.props.params.id:null;
        let reserved = this.props.reserved?this.props.reserved:false;
		this.reset(id,reserved);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
            let id = this.props.params.id?this.props.params.id:null;
            let reserved = this.props.reserved?this.props.reserved:false;
            if(this.props.params.id)
			    this.reset(id,reserved);
		}
        console.log(this.state.sale);
	}

    reset(id,reserved){
        if (id !== null){
            getSale(id).then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        sale:new Sale(res),
                        discount_auth: res.sale_auth_discount,
                        discount_no_auth: null,
                        service_date_original:res.service_date,
                        old_sale:null,
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.property,
                        },
                        modal_discount: {
                            ...prev_State.modal_discount,
                            property:res.property,
                        },
                        modal_payment: {
                            ...prev_State.modal_payment,
                            property:res.property
                        },
                    };
                },()=>{
                    this.options_load();
                    this.service_sale_details();
                    getProfile().then(res => {
                        this.setState({
                            user_extension:res,
                        });
                    });
                });
            });
        } else {
            this.setState({
                id:null,
                sale: new Sale({
                    id:null,
                    status:reserved?"B":"A",
                    name_pax:"",
                    email:"",
                    sale_service_fee:false,
                    service_fee:20,
                    user_extension:null,
                    user_extension_name:"",
                    representative:null,
                    representative_name:"",
                    sale_key:null,
                    sale_reservation_id:0,
                    reservation_service:null,
                    service:null,
                    service_data:null,
                    service_date:"",
                    service_rate:null,
                    service_rate_data:null,
                    schedule:null,
                    schedule_data:null,
                    schedule_time:"",
                    schedule_max:0,
                    schedule_reserved:0,
                    time:"",
                    address:"",
                    sale_date:"",
                    sale_type:null,
                    sale_type_data:null,
                    client_type:null,
                    client_type_data:null,
                    adults:0,
                    childs:0,
                    discount_type:"amount",
                    discount:0,
                    overcharged:0,
                    hotel:null,
                    hotel_name:"",
                    room:"",
                    confirm_provider:"",
                    comments:"",
                    comments_coupon: "",
                    property:null,
                    sale_payments:[]
                }),
                discount_auth: null,
                discount_no_auth: null,
                old_sale:null,
                modal_properties:{
                    type:'property',
                    isopen:true,
                    filter:"VP",
                    value:null
                },
            });
            axios.get(`${ApiSalesUrl}sale/date/`).then(res => {
                this.setState(function (prev_State) {
                    return {
                        sale: {
                            ...prev_State.sale,
                            sale_date:res.data,
                        },
                        options_representatives: [{value:res.data.representative,label:res.data.representative_name}]
                    }
                },()=>{
                    this.options_load();
                });
            });
            getProfile().then(res => {
                var representative = null,
                    representative_name = "",
                    options_representatives = this.state.options_representatives;
                if(res.representative != null){
                    representative = res.representative.id;
                    representative_name = res.representative.name;
                    options_representatives = [{value:representative,label:representative_name}]
                }
                this.setState(function (prev_State) {
                    return {
                        sale: {
                            ...prev_State.sale,
                            user_extension:res.id,
                            user_extension_name:res.user.username,
                            representative:representative,
                            representative_name:representative_name,
                        },
                        user_extension:res,
                        options_representatives:options_representatives
                    }
                });
            });
        }
    }
    
    options_load(){
        if (this.state.sale.property !== null){
            axios.get(`${ApiUrl}general/hotels/?limit=500&properties=${this.state.sale.property}`)
            .then(res => {
                this.setState({
                    options_hotels:res.data.results.map((hotel)=>{return {value:hotel.id,label:hotel.name}})
                });
            }).catch(error => {
                this.setState({
                    options_hotels:[]
                });
                this.catchErrorCatalog(error,"Hoteles");
            });
            if(this.state.sale.sale_type !== null){
                axios.get(`${ApiSalesUrl}payment_methods/?sale_types=${this.state.sale.sale_type}&property=${this.state.sale.property}`)
                .then(res => {
                    this.setState({
                        options_payment_methods:res.data.results.map((payment_method)=>{return {value:payment_method.id,label:payment_method.name,data:payment_method}})
                    });
                }).catch(error => {
                    this.setState({
                        options_payment_methods:[]
                    });
                    this.catchErrorCatalog(error,"Formas de pago");
                });
            }
            axios.get(`${ApiSalesUrl}client_types/?limit=500&property=${this.state.sale.property}`)
            .then(res => {
                this.setState({
                    options_client_types:res.data.results.map((client_type)=>{return {value:client_type.id,label:client_type.name,data:client_type}})
                });
            }).catch(error => {
                this.setState({
                    options_client_types:[]
                });
                this.catchErrorCatalog(error,"Tipo de cliente");
            });
            axios.get(`${ApiUrl}general/saletypes/?limit=500&property=${this.state.sale.property}&ordering=name`)
            .then(res => {
                this.setState({
                    options_sale_types:res.data.results.map((sale_type)=>{return {value:sale_type.id,label:sale_type.name,data:sale_type}})
                });
            }).catch(error => {
                this.setState({
                    options_sale_types:[]
                });
                this.catchErrorCatalog(error,"Tipo de venta");
            });
            axios.get(`${ApiSalesUrl}payment_methods/?is_service_fee=true&property=${this.state.sale.property}`)
            .then(res => {
                var payment_method = null;
                if(res.data.results.length>0){
                    payment_method = {
                        value:res.data.results[0].id,
                        label:res.data.results[0].name,
                        data:res.data.results[0]
                    }
                }
                this.setState({
                    payment_method_service_fee:payment_method
                });
                if(payment_method === null){
                    window.alert("No hay metodo de pago service fee, para esta propiedad");
                }
            }).catch(error => {
                this.catchErrorCatalog(error,"Formas de pago");
            });
        }
        if((this.state.sale.sale_date !== "" || this.state.sale.service_date !== "") && this.state.sale.property !== null){
            let date = this.state.sale.service_date !== ""?this.state.sale.service_date:this.state.sale.sale_date.substring(0, 10);
            axios.get(`${ApiSalesUrl}sale_services/?date=${date}&sale_service_fee=${this.state.sale.sale_service_fee}&property=${this.state.sale.property}`)
            .then(res => {
                this.setState({
                    options_services:res.data.results.map((service)=>{return {value:service.id,label:service.id+" - "+service.name+" - "+service.provider_name,data:service}})
                });
            });
            axios.get(`${ApiSalesUrl}exchange_rate/?date=${this.state.sale.sale_date.substring(0, 10)}&property=${this.state.sale.property}`)
            .then(res => {
                this.setState({
                    exchange_rate:res.data.data
                },()=>{
                    this.sale_total_balance();
                });
            }).catch(error => {
                this.catchErrorCatalog(error,"Tipos de cambio");
            });
            axios.get(`${ApiUrl}general/representatives/?limit=500&active=true&property=${this.state.sale.property}`)
            .then(res => {
                this.setState({
                    options_representatives:res.data.results.map((representative)=>{return {value:representative.id,label:representative.name}})
                });
            }).catch(error => {
                if(this.state.sale.representative===null)
                    this.catchErrorCatalog(error,"Representantes");
            });
        }
    }

    catchErrorCatalog(error,catalogo){
        if (this.state.sale.property===null){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message:  "Propiedad: No tienes asignada una propiedad para esta venta",
                    },
                };
            });
        } else if(error.response.status == 403){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: catalogo + ": No tiene permisos a este catalogo",
                    },
                };
            });
        }
    }

    service_sale_details(){
        if(this.state.sale.service !== null && this.state.sale.service_date !== "" && this.state.sale.service_data.availability_group !== null){
            axios.get(`${ApiSalesUrl}sale_schedule_available/?service_date=${this.state.sale.service_date}&service=${this.state.sale.service}&sale=${this.state.id?this.state.id:""}&property=${this.state.sale.property}`)
            .then(res => {
                let options_schedules = res.data.map((schedule)=>{return {value:schedule.id,label:schedule.time, reserved:schedule.reserved, limit:schedule.limit, pick_ups:schedule.pick_ups}});
                if(this.state.sale.time !== null && this.state.sale.schedule_max===undefined){
                    var schedule = res.data.find((schedule)=>schedule.time === this.state.sale.time);
                    if(schedule){
                        this.setState(function (prevState) {
                            return {
                                sale: {
                                    ...prevState.sale,
                                    schedule:schedule.id,
                                    schedule_data:schedule,
                                    schedule_time:schedule.time,
                                    schedule_max:schedule.limit,
                                    schedule_reserved:schedule.reserved,
                                },
                                options_schedule_pickups:schedule.pick_ups
                            };
                        });
                    } else if(this.state.id !== null && this.state.sale.schedule_data !== null) {
                        options_schedules.push({
                            value:this.state.sale.schedule_data.id,
                            label:this.state.sale.schedule_data.time, 
                            reserved:this.state.sale.schedule_data.reserved, 
                            limit:this.state.sale.schedule_data.limit, 
                            pick_ups:this.state.sale.schedule_data.pick_ups
                        })
                    }
                }
                this.setState({
                    options_schedules:options_schedules
                });
                if(options_schedules.length==1&&this.state.sale.time === null){
                    let data = options_schedules[0];
                    this.setState(function (prevState) {
                        return {
                            sale: {
                                ...prevState.sale,
                                schedule:data.value,
                                schedule_time:data.label,
                                schedule_reserved:data.reserved,
                                schedule_max:data.limit,
                                time:data.label,
                            },
                            options_schedule_pickups:data.pick_ups
                        };
                    });
                }
                if(res.data.length===0){
                    if(this.state.sale.id!==null){
                        if(this.state.service_date_original!=="" && this.state.service_date_original!==this.state.sale.service_date){
                            window.alert("Este servicio no tiene disponiblidad");
                            this.setState(function (prevState) {
                                return {
                                    sale: {
                                        ...prevState.sale,
                                        service_date:this.state.service_date_original!==""?this.state.service_date_original:this.state.sale.service_date,
                                    },
                                };
                            },()=>{
                                this.get_discount();
                                this.service_sale_details();
                            });
                        } else{
                            window.alert("Error en disponibildad, ingrese otra fecha o verifique las operaciones para ese dia");
                        }
                    } else {
                        window.alert("Este servicio no tiene disponiblidad");
                        this.setState(function (prevState) {
                            return {
                                sale: {
                                    ...prevState.sale,
                                    service:null,
                                    service_data:null,
                                    service_rate:null,
                                    service_rate_data:null,
                                    schedule:null,
                                    schedule_time:"",
                                    schedule_max:0,
                                    schedule_reserved:0,
                                    time:null,
                                },
                            };
                        },()=>{
                            this.get_discount();
                            this.service_sale_details();
                        });
                    }
                }
            });
        } else {
            this.setState({
                options_schedules:[]
            });
        }
        if(this.state.sale.service !== null && this.state.sale.service_date !== "" && this.state.sale.service_rate === null){
            axios.get(`${ApiSalesUrl}sale_service_rate/?service_date=${this.state.sale.service_date}&service=${this.state.sale.service}`)
            .then(res => {
                this.setState(function (prev_State) {
                    return {
                        sale: {
                            ...prev_State.sale,
                            service_rate:res.data.data.id,
                            service_rate_data:res.data.data,
                        },
                    }
                },()=>{
                    this.sale_total_balance();
                });
            }); 
        } else {
            this.sale_total_balance();
        }
    }

    get_discount(){
        if(this.state.sale.service !== null && this.state.sale.sale_date !== "" &&
            this.state.sale.sale_type !== null && this.state.sale.client_type !== null &&
            this.state.sale.property !== null){
                axios.get(`${ApiSalesUrl}sale_discount/?date=${this.state.sale.sale_date.substring(0, 10)}&service=${this.state.sale.service}&sale_type=${this.state.sale.sale_type}&client_type=${this.state.sale.client_type}&property=${this.state.sale.property}`)
                .then(res => {
                    if(this.state.sale.discount_type==="percent"&&this.state.sale.discount<res.data.discount ||
                        this.state.sale.discount_type==="amount"&&this.state.sale.discount===0){
                            this.setState(function (prev_State) {
                                return {
                                    sale: {
                                        ...prev_State.sale,
                                        discount_type:"percent",
                                        discount:res.data.discount,
                                    },
                                    discount_no_auth:res.data,
                                }
                            },()=>{
                                this.sale_total_balance();
                            });
                    } else {
                        this.setState(function (prev_State) {
                            return {
                                discount_no_auth:null,
                            }
                        },()=>{
                            this.sale_total_balance();
                        });
                    }
                }); 
            }
    }

    onServiceData(){
        this.setState({
            modal_service:{
                open:true,
                id:this.state.sale.service,
                sale_date:this.state.sale.service_date !== ""?this.state.sale.service_date:this.state.sale.sale_date.substring(0, 10),
            },
        });
    }

    sale_total_balance(){
        if(this.state.sale.service_rate !== null && this.state.exchange_rate !== null){
            var adult_price = this.state.sale.service_fee/100;
            var child_price = 0;
            if(!this.state.sale.sale_service_fee){
                adult_price = this.state.sale.service_rate_data.adult_price;
                child_price = this.state.sale.service_rate_data.child_price;
                if(this.state.sale.service_rate_data.currency === "MN"){
                    adult_price = adult_price/this.state.exchange_rate.usd_currency;
                    child_price = child_price/this.state.exchange_rate.usd_currency;
                } else if(this.state.sale.service_rate_data.currency === "EURO"){
                    adult_price = (adult_price*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency;
                    child_price = (child_price*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency;
                }
            }
            var sale_total = (adult_price*this.state.sale.adults) + (child_price*this.state.sale.childs);
            var discount = this.state.sale.discount;
            if(this.state.sale.discount_type === "percent"){
                discount = (discount/ 100) * sale_total
            }
            sale_total = sale_total + (this.state.sale.overcharged - discount)
            var sale_payments = this.state.sale.sale_payments;
            var sale_payments_amount = 0;
            for (let index = 0; index < sale_payments.length; index++) {
                const sale_payment = sale_payments[index];
                var amount = sale_payment.amount;
                if(sale_payment.payment_method_data.currency === "MN"){
                    amount = amount/this.state.exchange_rate.usd_currency;
                } else if(sale_payment.payment_method_data.currency === "EURO"){
                    amount = (amount*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency;
                }
                sale_payments_amount+= amount
            }
            this.setState({
                adult_price:adult_price,
                adult_total:adult_price*this.state.sale.adults,
                child_price:child_price,
                child_total:child_price*this.state.sale.childs,
                sale_total:sale_total,
                sale_balance:sale_total.toFixed(2)===sale_payments_amount.toFixed(2),
                sale_payments_amount:sale_payments_amount
            });
        } else {
            this.setState({
                adult_price:0,
                adult_total:0,
                child_price:0,
                child_total:0,
                sale_total:0,
                sale_balance:false,
                sale_payments_amount:0
            });
        }
    }

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                modal_reservation_sales: {
                    ...prev_State.modal_reservation_sales,
                    open: false,
                },
            };
        });
	}

    handleCloseError = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
	}

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "hotel":
                options = this.state.options_hotels;
                break;
            case "sale_type":
                options = this.state.options_sale_types;
                break;
            case "client_type":
                options = this.state.options_client_types;
                break;
            case "service":
                options = this.state.options_services;
                break;
            case "schedule":
                options = this.state.options_schedules;
                break;
            case "representative":
                options = this.state.options_representatives;
                break;
        }
        value = options.find((option)=>option.value===this.state.sale[field]);
        return value!==undefined?value:null;
    }

    handleNewSalePayment = (e) => {
        let options_payment_methods = this.state.options_payment_methods;
        if(options_payment_methods.find((payment_method)=>payment_method.value===this.state.payment_method_service_fee.value) === undefined){
            if(this.state.sale.sale_service_fee)
                options_payment_methods.push(this.state.payment_method_service_fee);
        } else if(this.state.sale.sale_service_fee===false) {
            options_payment_methods = options_payment_methods.filter((payment_method)=>payment_method.data.is_service_fee!==true)
        }
        this.setState({
            modal_payment:{
                sale_payment: new SalePayment({
                    id:null,
                    sale:this.state.sale.id,
                    authorization:"",
                    amount:0,
                    department_cecos:null,
                    department_cecos_data:null,
                    payment_method:null,
                    payment_method_data:null,
                }),
                sale_payments_amount:this.state.sale_payments_amount,
                sale_total:this.state.sale_total,
                sale_data:{
                    name_pax:this.state.sale.name_pax,
                    email:this.state.sale.email,
                    concept:this.state.sale.service_data.name,
                },
                exchange_rate: this.state.exchange_rate,
                options_payment_methods: options_payment_methods
            }
        });
	}

    onDeleteSalePayment(data,index){
        if(window.confirm("¿Desea eliminar '"+data.payment_method_data.name+"' de los pagos?")){
            let sale_payments = this.state.sale.sale_payments;
            sale_payments.splice(index, 1);
            this.setState(function (prev_State) {
                return {
                    sale:{
                        ...prev_State.sale,
                        sale_payments:sale_payments
                    }
                };
            },()=>{
                this.sale_total_balance();
            });
        }
        
	}

    handleCloseSalePayment = () => {
        this.setState(function (prev_State) {
            return {
                modal_payment:{
                    index:null,
                    sale_payment:null
                }
            };
        });
    }

    handleCloseDiscount = () => {
        this.setState(function (prev_State) {
            return {
                modal_discount:{
                    ...prev_State.modal_discount,
                    open:false,
                    discount_key:"",
                },
                sale:{
                    ...prev_State.sale,
                    discount:0
                }
            };
        },()=>{
            this.get_discount();
            this.service_sale_details();
        });
    }

    onEditSalePayment(sale_payment,index){
        var amount = sale_payment.amount;
        if(sale_payment.payment_method_data.currency === "MN"){
            amount = amount/this.state.exchange_rate.usd_currency;
        } else if(sale_payment.payment_method_data.currency === "EURO"){
            amount = (amount*this.state.exchange_rate.euro_currency)/this.state.exchange_rate.usd_currency;
        }
        var sale_payments_amount = this.state.sale_payments_amount - amount;
        let options_payment_methods = this.state.options_payment_methods;
        if(options_payment_methods.find((payment_method)=>payment_method.value===this.state.payment_method_service_fee.value) === undefined){
            if(this.state.sale.sale_service_fee)
                options_payment_methods.push(this.state.payment_method_service_fee);
        } else if(this.state.sale.sale_service_fee===false) {
            options_payment_methods = options_payment_methods.filter((payment_method)=>payment_method.data.is_service_fee===true)
        }
        this.setState({
            modal_payment:{
                index:index,
                sale_payment:Object.assign({},sale_payment),
                sale_id:this.state.sale.id,
                sale_payments_amount:sale_payments_amount,
                sale_total:this.state.sale_total,
                sale_data:{
                    name_pax:this.state.sale.name_pax,
                    email:this.state.sale.email,
                    concept:this.state.sale.service_data.name,
                },
                exchange_rate: this.state.exchange_rate,
                options_payment_methods: options_payment_methods
            },
        });
	}

    handleSaveSalePayment = (data,index) => {
        let sale_payments = this.state.sale.sale_payments;
        if(index!==null)
            sale_payments[index] = new SalePayment(data);
        else
            sale_payments.push(new SalePayment(data))
        this.setState(function (prevState) {
            return {
                sale: {
                    ...prevState.sale,
                    sale_payments:sale_payments
                },
                modal_payment:{
                    index:null,
                    sale_payment:null,
                    sale_payments_amount:0,
                    sale_total:0,
                    exchange_rate: this.state.exchange_rate,
                    options_payment_methods: this.state.options_payment_methods
                }
            };
        },()=>{
            this.sale_total_balance();
        });
	}

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    modal_reservation_sales: {
                        ...prev_State.modal_reservation_sales,
                        property:value
                    },
                    modal_discount: {
                        ...prev_State.modal_discount,
                        property:value
                    },
                    modal_payment: {
                        ...prev_State.modal_payment,
                        property:value
                    },
                    sale:{
                        ...prev_State.sale,
                        property:value
                    }
                };
            },()=>{
                this.options_load();
            }
        );
	}

    handlePropertyClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: false,
                },
            };
        });
	}

    handleServiceClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_service: {
                    ...prev_State.modal_service,
                    open: false,
                    id: null,
                },
            };
        });
	}

    handleCloseAddMore = () => {
		this.setState(function (prev_State) {
            return {
                id:null,
                sale: new Sale({
                    id:null,
                    status:this.state.sale.status,
                    name_pax:this.state.sale.name_pax,
                    email:this.state.sale.email,
                    sale_service_fee:false,
                    service_fee:20,
                    user_extension:null,
                    user_extension_name:"",
                    representative:null,
                    representative_name:"",
                    sale_key:null,
                    sale_reservation_id:0,
                    reservation_service:null,
                    service:null,
                    service_data:null,
                    service_date:"",
                    service_rate:null,
                    service_rate_data:null,
                    schedule:null,
                    schedule_time:"",
                    schedule_max:0,
                    schedule_reserved:0,
                    time:null,
                    address:"",
                    sale_date:"",
                    sale_type:this.state.sale.sale_type,
                    sale_type_data:this.state.sale.sale_type_data,
                    client_type:this.state.sale.client_type,
                    client_type_data:this.state.sale.client_type_data,
                    adults:this.state.sale.adults,
                    childs:this.state.sale.childs,
                    discount_type:"amount",
                    discount:0,
                    overcharged:0,
                    hotel:this.state.sale.hotel,
                    hotel_name:this.state.sale.hotel_name,
                    room:this.state.sale.room,
                    confirm_provider:"",
                    comments:this.state.sale.comments,
                    comments_coupon: this.state.sale.comments_coupon,
                    property:null,
                    sale_payments:[]
                }),
                old_sale:null,
                discount_auth: null,
                discount_no_auth: null,
                modal_properties:{
                    type:'property',
                    isopen:true,
                    filter:"VP",
                    value:null
                },
                modal: {
                    ...prev_State.modal,
                    message: null,
                }
            }
        });
        axios.get(`${ApiSalesUrl}sale/date/`).then(res => {
            this.setState(function (prev_State) {
                return {
                    sale: {
                        ...prev_State.sale,
                        sale_date:res.data,
                    },
                }
            },()=>{
                this.options_load();
            });
        });
        getProfile().then(res => {
            var representative = this.state.sale.representative,
                representative_name = this.state.sale.representative_name,
                options_representatives = this.state.options_representatives;
            if(res.representative != null){
                representative = res.representative.id;
                representative_name = res.representative.name;
                options_representatives = [{value:representative,label:representative_name}]
            }
            this.setState(function (prev_State) {
                return {
                    sale: {
                        ...prev_State.sale,
                        user_extension:res.id,
                        user_extension_name:res.user.username,
                        representative:representative,
                        representative_name:representative_name,
                    },
                    user_extension:res,
                    options_representatives:options_representatives
                }
            });
        });
        this.props.history('/sale/')
	}

    handleSearchReservation(){
        this.setState(function (prev_State) {
            return {
                modal_reservation_sales: {
                    ...prev_State.modal_reservation_sales,
                    open: true,
                },
            };
        });
    }

    handleReservationToSale = (reservation_sales) => {
        this.setState(function (prev_State) {
            return {
                reservation_sales:reservation_sales,
                reservation_to_sale_process:true,
                modal_reservation_sales: {
                    ...prev_State.modal_reservation_sales,
                    open: false,
                },
            };
        },()=>this.handleAsignSaleFromList());
    }

    handleSaveDiscount = (data) => {
        this.setState(function (prev_State) {
            return {
                modal_discount: {
                    ...prev_State.modal_discount,
                    open: false,
                },
                discount_auth: data.id?data:null,
            };
        });
    }

    handleAsignSaleFromList(){
        let reservation_sales = this.state.reservation_sales;
        let reservation_sale = reservation_sales.shift();
        this.setState({
            reservation_sales:reservation_sales,
            sale:new Sale(reservation_sale),
            discount_auth: null,
            discount_no_auth: null,
        },()=>{
            this.options_load();
            this.service_sale_details();
        });
    }

    downloadDocument(){
        var url = `${ApiSalesUrl}print_sale/${this.state.id}/?create=false`;
        window.open(url, "_blank");
    }

    onMakeReservedSale(){
        axios.get(`${ApiSalesUrl}sale/date/`).then(res => {
            this.setState(function (prev_State) {
                return {
                    sale: {
                        ...prev_State.sale,
                        sale_date:res.data,
                        status:"A",
                    },
                    reserved_to_sale: true
                }
            },()=>{
                this.options_load();
                this.service_sale_details();
                this.sale_total_balance();
            });
        });
    }

    sendDocument(){
        sendSaleEmail(this.state.id).then(res => {
            let emails = res.email.split(";"),
                text = "";
            emails.forEach(email => {
                text += "\n -" + email
            });
            alert("Se ha enviado el correo a:" + text);
        })
    }

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    checkNumber(x) {
        x = parseFloat(x)
        if(typeof x==='number' && !isNaN(x)){
            return true
        }
        return false;
    }

    getServiceFeeControl(){
        if (this.state.sale.service_data !== null && this.state.sale.sale_type_data !== null){
            return this.state.sale.sale_service_fee === false && 
                this.state.sale.sale_type_data.is_service_fee === true && 
                this.state.sale.service_data.service_fee !== null
        }
        return false
    }

    getPickUp(){
        if(this.state.sale.time !== null && this.state.sale.hotel !== null){
            let pick_up = this.state.options_schedule_pickups.find((schedule_pickup)=>schedule_pickup.hotel===this.state.sale.hotel);
            if(pick_up){
                return pick_up.time;
            }
        }
        return "";
    }

    validDate(min_date,date){
        if(date===""||date===null)
            return true;
        return Date.parse(date)>=Date.parse(min_date);
    }

    inputDisabled(){
        if(this.state.sale.id!=null){
            return this.state.sale.status !== "B" && this.state.reserved_to_sale !== true
        }
        return false
    }

    inputDate(sale,){
        if(this.state.user_extension!==null&&this.state.user_extension.id){
            if(this.state.user_extension.permissions.find((permision)=>permision=="SalesApp.sales_management") !== undefined){
                return(
                    <>
                    <Label for="service_date" size='sm'>Fecha de servicio</Label>
                    <Input type="date"
                        bsSize="sm"
                        name="service_date"
                        value={sale.service_date}
                        onChange={this.onChangeValue}
                        required/>
                    </>
                );
            }
        }
        return(
            <>
            <Label for="service_date" size='sm'>Fecha de servicio</Label>
            <Input type="date"
                bsSize="sm"
                name="service_date"
                min={sale.sale_date.substring(0, 10)}
                value={sale.service_date}
                onChange={this.onChangeValue}
                required
                invalid={!this.validDate(sale.sale_date.substring(0, 10),sale.service_date)}/>
            {this.validDate(sale.sale_date.substring(0, 10),sale.service_date)?<></>:
            <FormFeedback>
                La fecha no es valida para venta
            </FormFeedback>}
            </>
        );
    }

    render(){
        const { id,sale, adult_price, adult_total, child_price, child_total, sale_total, sale_balance, sale_payments_amount, reserved_to_sale, reservation_to_sale_process, payment_method_service_fee, options_payment_methods, options_services, options_schedules, options_hotels, options_sale_types, options_client_types, options_representatives, exchange_rate, sale_request, discount_auth, user_extension, modal, modal_payment, modal_discount, modal_properties, modal_service, modal_reservation_sales } = this.state;
        const select_option_service = this.getOptionValue("service");
        const select_option_representative = this.getOptionValue("representative");
        const select_option_hotel = this.getOptionValue("hotel");
        const select_option_sale_type = this.getOptionValue("sale_type");
        const select_option_client_type = this.getOptionValue("client_type");
        const select_option_schedule = this.getOptionValue("schedule");
        const service_fee_control = this.getServiceFeeControl();
        const reserved = parseInt(sale.schedule_reserved?sale.schedule_reserved:0) + parseInt(sale.adults) + parseInt(sale.childs);
        const customSelectStyles = {
            control: (base) => ({
                ...base,
                height: 30,
                minHeight: 30
            }),
            singleValue: (provided) => ({
                ...provided,
                height: '30px',
                padding: '0px'
            }),
            input: (provided, state) => ({
                ...provided,
                margin: '0px',
            }),
            indicatorSeparator: state => ({
                display: 'none',
            }),
            indicatorsContainer: (provided, state) => ({
                ...provided,
                height: '30px',
            }),
            clearIndicator: (provided, state) => ({
                ...provided,
                padding: '2px',
            }),
            dropdownIndicator: (provided, state) => ({
                ...provided,
                padding: '2px',
            }),
        };
        const customSelectStylesService = {
            ...customSelectStyles,
            container:(base) =>({
                width: "90%"
            }),
        };
        return(<>
                <Form onSubmit={reservation_to_sale_process?this.handleSubmitReservationToSale:this.handleSubmit} id="sale-form">
                    <Row className='border-bottom'>
                        {sale.status==="B"?<></>:<>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="sale_date" size='sm'>Fecha venta</Label>
                                <Input type="date"
                                    bsSize="sm"
                                    name="sale_date"
                                    value={sale.sale_date.substring(0, 10)}
                                    disabled/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="sale_key" size='sm'>Cupon#</Label>
                                <Input type="text"
                                    bsSize="sm"
                                    name="sale_key"
                                    value={sale.sale_key?sale.sale_key.toString().padStart(8, '0'):""}
                                    disabled/>
                            </FormGroup>
                        </Col>
                        {sale.id===null||(sale.sale_key_manual!==null&&sale.sale_key_manual!=="")?
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="sale_key_manual" size='sm'>Cupon Manual</Label>
                                <Input type="text"
                                    bsSize="sm"
                                    name="sale_key_manual"
                                    value={sale.sale_key_manual}
                                    onChange={this.onChangeValue}
                                    disabled={this.inputDisabled()}/>
                            </FormGroup>
                        </Col>
                        :<></>}
                        {sale.id===null||(sale.sale_reservation_id!==null&&sale.sale_reservation_id!==0)?
                        <Col sm={2}>
                            <FormGroup>
                                <Label size='sm'>Referencia#</Label>
                                <InputGroup>
                                    <Input type="number"
                                        bsSize="sm"
                                        name="sale_reservation_id"
                                        value={sale.sale_reservation_id.toString().padStart(6, '0')}
                                        disabled/>
                                    <Button size='sm'
                                        color='primary'
                                        onClick={(e)=> this.handleSearchReservation()}
                                        disabled={sale.id!==null||sale.property===null}>
                                        <i className="bi bi-bus-front"></i>
                                    </Button>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        :<></>}
                        </>}
                        <Col sm={4}>
                            <FormGroup>
                                <Label size='sm'>Representante</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_representatives}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="representative"
                                    value={select_option_representative}
                                    onChange={this.onChangeSelectValue}
                                    isDisabled={user_extension.permissions.find((permision)=>permision=="SalesApp.sales_management") === undefined}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="user_extension_name" size='sm'>Usuario</Label>
                                <Input type="text"
                                    bsSize="sm"
                                    name="user_extension_name"
                                    value={sale.user_extension_name}
                                    disabled/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row className='border-bottom'>
                        <Col sm={6}>
                            <FormGroup>
                                <Label size='sm'>Servicio</Label>
                                <InputGroup>
                                    <Select
                                        styles={customSelectStylesService}
                                        options={options_services}
                                        isClearable={true}
                                        isSearchable={true}
                                        name="service"
                                        value={select_option_service}
                                        onChange={this.onChangeSelectValue}
                                        required
                                        style={{width:"90%"}}
                                        isDisabled={this.inputDisabled()}/>
                                    <Button color='secondary'
                                        size='sm'
                                        onClick={(e)=> this.onServiceData()}
                                        disabled={sale.service===null||this.state.sale.sale_service_fee}>
                                        <i className="bi bi-bus-front"></i>
                                    </Button>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <Row className='row-sm'>
                                <Col sm={7}>
                                    <Row>
                                        <Col sm={6}>
                                            <FormGroup>
                                                {this.inputDate(sale)}
                                            </FormGroup>
                                        </Col>
                                        <Col sm={3}>
                                            <FormGroup>
                                                <Label for="schedule_reserved" size='sm'>Reservas</Label>
                                                <Input type="number"
                                                    bsSize="sm"
                                                    name="schedule_reserved"
                                                    value={reserved}
                                                    disabled/>
                                            </FormGroup>
                                        </Col>
                                        <Col sm={3}>
                                            <FormGroup>
                                                <Label for="schedule_max" size='sm'>Max</Label>
                                                <Input type="number"
                                                    bsSize="sm"
                                                    name="schedule_max"
                                                    value={sale.schedule_max}
                                                    disabled/>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col sm={5}>
                                    <Row>
                                        <Col sm={7}>
                                            <FormGroup>
                                                <Label size='sm'>Horario</Label>
                                                <Select
                                                    styles={customSelectStyles}
                                                    options={options_schedules}
                                                    isClearable={true}
                                                    isSearchable={true}
                                                    name="schedule"
                                                    value={select_option_schedule}
                                                    onChange={this.onChangeSelectValue}
                                                    required={options_schedules.length>0}/>
                                            </FormGroup>
                                        </Col>
                                        <Col sm={5}>
                                            <FormGroup>
                                                <Label for="pick_up" size='sm'>Pick Up</Label>
                                                <Input type="text"
                                                    bsSize="sm"
                                                    name="pick_up"
                                                    value={this.getPickUp()}
                                                    disabled/>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                        
                    </Row>
                    <Row className='border-bottom'>
                        <Col sm={3}>
                            <FormGroup>
                                <Label for="name_pax" size='sm'>Nombre pax</Label>
                                <Input type="text" 
                                    name="name_pax"
                                    bsSize="sm"
                                    value={sale.name_pax}
                                    onChange={this.onChangeValue}
                                    required
                                    disabled={this.inputDisabled()}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label for="email" size='sm'>Correo electronico</Label>
                                <Input type="text" 
                                    name="email"
                                    bsSize="sm"
                                    value={sale.email}
                                    onChange={this.onChangeValue}
                                    disabled={this.inputDisabled()}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label size='sm'>Tipo de venta</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_sale_types}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="sale_type"
                                    value={select_option_sale_type}
                                    onChange={this.onChangeSelectValue}
                                    required
                                    isDisabled={this.inputDisabled()}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label size='sm'>Tipo de cliente</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_client_types}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="client_type"
                                    value={select_option_client_type}
                                    onChange={this.onChangeSelectValue}
                                    required
                                    isDisabled={this.inputDisabled()}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label size='sm'>Adultos</Label>
                                <InputGroup size="sm">
                                    <Input type="number" 
                                        name="adults"
                                        bsSize="sm"
                                        value={sale.adults}
                                        onChange={this.onChangeValue}
                                        min={0}
                                        step={sale.sale_service_fee?0.01:1}
                                        required
                                        disabled={(this.inputDisabled())||adult_price===0}/>
                                        <InputGroupText>
                                        $
                                        </InputGroupText>
                                        <InputGroupText>
                                        {this.currencyFormat(adult_price)}
                                        </InputGroupText>
                                        <InputGroupText>
                                        {this.currencyFormat(adult_total)}
                                        </InputGroupText>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label size='sm'>Menores</Label>
                                <InputGroup size="sm">
                                    <Input type="number" 
                                        name="childs"
                                        bsSize="sm"
                                        value={sale.childs}
                                        onChange={this.onChangeValue}
                                        min={0}
                                        step={sale.sale_service_fee?0.01:1}
                                        required
                                        disabled={(this.inputDisabled())||child_price===0}/>
                                        <InputGroupText>
                                        $
                                        </InputGroupText>
                                        <InputGroupText>
                                        {this.currencyFormat(child_price)}
                                        </InputGroupText>
                                        <InputGroupText>
                                        {this.currencyFormat(child_total)}
                                        </InputGroupText>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label size='sm'>Hotel</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_hotels}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="hotel"
                                    value={select_option_hotel}
                                    onChange={this.onChangeSelectValue}
                                    required
                                    isDisabled={this.inputDisabled()}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="room" size='sm'>Habitación</Label>
                                <Input type="text" 
                                    name="room"
                                    bsSize="sm"
                                    value={sale.room}
                                    onChange={this.onChangeValue}
                                    disabled={this.inputDisabled()}
                                    required={sale.id===null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <FormGroup>
                                <Label for="confirm_provider" size='sm'>Confirmacion Prov.</Label>
                                <Input type="text" 
                                    name="confirm_provider"
                                    bsSize="sm"
                                    value={sale.confirm_provider}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    {sale.status==="B"?<></>:<>
                    <Row className='border-bottom'>
                        <Col sm={4}>
                            <FormGroup>
                                <Label size='sm' style={{display:'block'}}>
                                    Descuento {discount_auth?"Autorizacion:"+discount_auth.discount_key:""}
                                </Label>
                                <FormGroup tag="fieldset" style={{width:'15%',display:'inline-block',verticalAlign:'top'}}
                                    onChange={this.onChangeValueRadioType}>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="discount_type"
                                            value={'amount'}
                                            checked={sale.discount_type=="amount"}
                                            disabled={sale.id!==null&&reserved_to_sale===false}/>
                                        <Label check>
                                            $
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="discount_type"
                                            value={'percent'}
                                            checked={sale.discount_type=="percent"}
                                            disabled={sale.id!==null&&reserved_to_sale===false}/>
                                        <Label check>
                                            %
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                                <Input type='number'
                                    name="discount"
                                    placeholder="Descuento"
                                    required
                                    max={sale.discount_type=="percent"?100:undefined}
                                    value={sale.discount}
                                    onChange={this.onChangeValue}
                                    style={{width:'85%',display:'inline-block'}}
                                    disabled={sale.id!==null&&reserved_to_sale===false}/>                                
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label size='sm'>
                                    Cobrado de mas
                                </Label>
                                <Input type='number'
                                    name="overcharged"
                                    placeholder="Cobrado de mas"
                                    required
                                    value={sale.overcharged}
                                    onChange={this.onChangeValue}
                                    disabled={sale.id!==null&&reserved_to_sale===false}/>
                            </FormGroup>
                        </Col>
                        <Col></Col>
                        <Col sm={4}>
                            <Label size='sm'>T/C USD <b>{exchange_rate?exchange_rate.usd_currency:0}</b></Label>
                        </Col>
                        <Col sm={4}>
                            <Label size='sm'>T/C Euro <b>{exchange_rate?exchange_rate.euro_currency:0}</b></Label>
                        </Col>
                        <Col sm={4}>
                            {service_fee_control===true?
                            <FormGroup tag="fieldset" onChange={this.onChangeValueRadioTypeServiceFee} required>
                            <legend>
                                <h5>Service Fee</h5>
                            </legend>
                            {sale.service_data.service_fee_amount.split(",").map((service_fee)=>(
                                this.checkNumber(service_fee)?
                                <FormGroup check inline>
                                    <Input type="radio"
                                        name="service_fee"
                                        value={service_fee}
                                        checked={sale.service_fee===parseFloat(service_fee)}
                                        disabled={sale.id!==null&&reserved_to_sale===false}/>
                                    <Label check>
                                        {service_fee}%
                                    </Label>
                                </FormGroup>
                                :<></>
                            ))}                            
                            </FormGroup>
                            :<></>}
                        </Col>
                        <Col sm={12}>
                            <h5>
                                <Badge color='primary'>Total</Badge>
                                {'  '}
                                {this.currencyFormat(sale_total)}
                            </h5>
                        </Col>
                        <Col sm={12}>
                            <h5 className={sale_balance?"text-success":"text-danger"}>
                                <Badge color={sale_balance?"success":"danger"}>Saldo</Badge>
                                {'  '}
                                {this.currencyFormat(sale_total-sale_payments_amount)}
                            </h5>
                        </Col>
                    </Row>
                    <Row className='border-bottom pt-2'>
                        <Col sm={3}>
                            <Button color="primary" onClick={this.handleNewSalePayment} disabled={
                                (sale.service_rate===null&&sale.time===null)||
                                (payment_method_service_fee===null&&options_payment_methods.length===0)||
                                (sale.id!==null&&reserved_to_sale===false)}>
                                <i className="bi bi-plus"></i> Agregar
                            </Button>
                        </Col>
                        <Col sm={12}>
                            <p id="before-table"></p>
                            <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                                <thead>
                                    <tr>
                                        <th width={"35%"}>Metodo de pago</th>
                                        <th width={"12%"}>Importe</th>
                                        <th width={"20%"}>Departamento CECOS</th>
                                        <th width={"15%"}>Autorización</th>
                                        <th width={"13%"}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.sale_payments.map((sale_payment,index) => (
                                        <tr key={index}>
                                            <td>{sale_payment.payment_method_data.name}</td>
                                            <td>$ {this.currencyFormat(sale_payment.amount)}</td>
                                            <td>{sale_payment.department_cecos_data!=null?sale_payment.department_cecos_data.name:""}</td>
                                            <td>{sale_payment.credit_charge_data?sale_payment.credit_charge_data.transaction_id:sale_payment.authorization}</td>
                                            <td className='text-center'>
                                                <ButtonGroup>
                                                    <Button color="info"
                                                        size='sm'
                                                        onClick={(e)=> this.onEditSalePayment(sale_payment,index)}>
                                                        <i className="bi bi-pencil-fill"></i>
                                                    </Button>
                                                    <Button color="warning" 
                                                        size='sm'
                                                        disabled={sale.status==="C"||sale.id!==null&&reserved_to_sale===false}
                                                        onClick={(e)=> this.onDeleteSalePayment(sale_payment,index)}>
                                                        <i className="bi bi-trash-fill"></i>
                                                    </Button>
                                                </ButtonGroup>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Col>
                    </Row></>}
                    <Row className='border-bottom'>
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="comments_coupon" size='sm'>Comentarios de cupon</Label>
                                <Input type="textarea" 
                                    name="comments_coupon"
                                    bsSize="sm" 
                                    placeholder="Comentarios de cupon" 
                                    value={sale.comments_coupon}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="comments" size='sm'>Comentarios</Label>
                                <Input type="textarea" 
                                    name="comments"
                                    bsSize="sm" 
                                    placeholder="Comentarios" 
                                    value={sale.comments}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup className='pt-2'>
                        <ButtonGroup>
                            <Button color="primary" type="submit" form='sale-form' disabled={(!sale_balance&&sale.status!=="B")||sale.status==="C"||sale_request}>
                                <i className="bi bi-save"></i> Guardar
                            </Button>
                            {sale.status==="B"&&id!==null?
                            <Button color="secondary" onClick={(e)=> this.onMakeReservedSale()}>
                                <i className="bi bi-archive-fill"></i> Convertir a venta
                            </Button>
                            :<></>}
                            {sale.status==="A"&&id!==null?
                            <Button color="success" onClick={()=>this.downloadDocument()} disabled={id===null}>
                                <i className="bi bi-cloud-arrow-down-fill"></i> Imprimir cupón
                            </Button>
                            :<></>}
                        </ButtonGroup>
                    </FormGroup>
               </Form>
               <ModalAlert handleClose={this.handleClose}  handleCloseError={this.handleCloseError} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
               <ModalPropertiesAsignment handleAsignment={this.handleAsignment} handleClose={this.handlePropertyClose} data={modal_properties}  />
               <ModalSalePayment handleClose={this.handleCloseSalePayment} handleSave={this.handleSaveSalePayment} data={modal_payment}/>
               <ModalServiceData handleClose={this.handleServiceClose} data={modal_service} />
               <ModalDiscountAuthozation handleClose={this.handleCloseDiscount} handleSave={this.handleSaveDiscount} data={modal_discount}/>
               <ModalReservationSaleAsignment handleClose={this.handleClose} handleSave={this.handleReservationToSale} data={modal_reservation_sales} />
        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <SaleForm {...props} params = {params} history={history} />;
}