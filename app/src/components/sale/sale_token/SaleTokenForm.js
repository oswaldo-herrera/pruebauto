import React,{Component} from 'react';
import { Link, useNavigate, useParams, withRouter } from 'react-router-dom';
import { Col, Row, Button, ButtonGroup, Table, InputGroup, InputGroupText, Badge, FormFeedback } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { Sale, SalePayment, createSale, updateSale, getSale, sendSaleEmail, getTokenSale, createSaleToken } from './../SaleModel';
import { ApiUrl, ApiSalesUrl } from '../../../constants/api/site';
import axios from "axios";
import ModalAlert from '../../ModalAlert';
import { getProfile } from '../../user/UserModel';
import ModalPropertiesAsignment from '../../ModalPropertiesAsignment';
import ModalServiceData from './../ModalServiceData';
class SaleTokenForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.openSale = this.openSale.bind(this);
        this.state={
            lang:'es',
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
            sale_total:0,
            exchange_rate:null,
            url_payment:null,
            services: [],
            options_services: [],
            options_properties: [],
            options_schedules: [],
            options_schedule_pickups: [],
            modal:{
                title: "Venta",
                type: 'success',
                message: null,
            },
            modal_service:{
                open:false,
                id:null,
                sale_date:"",
            },
        }
        axios.get(`${ApiUrl}sales/sale_token/properties/`)
        .then(res => {
            this.setState({
                options_properties: res.data.map((property)=>{
                    return {
                        value:property.id,
                        label:property.name
                }})
            });
        });
    }

    changeLanguage(lang){
        this.setState({
            lang: lang
        },()=>this.loadLanguage());
    }

    loadLanguage(){
        this.setState({
            options_services:this.state.services.map((service_data)=>{
                return {
                    value:service_data.service.id,
                    label:this.state.lang==="en"?service_data.service.name_online_sale_en:service_data.service.name_online_sale_es,
                    data:service_data.service,
                    schedules:service_data.schedules,
                    service_rate:service_data.service_rate,
                }
            })
        });
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
            if(event.target.name==="adults"||event.target.name==="childs" || event.target.name==="service_date"){
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
                        },
                    };
                },()=>{
                    this.load_services();
                }); 
            }
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
            if(event.name==="property"){
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
                            user_extension:null,
                            representative:null,
                            client_type:null,
                            sale_type:null,
                            hotel:null,
                        },
                    };
                },()=>{
                    this.load_data();
                });
            }
            if(event.name==="service"){
                let options_schedules = []
                if(data!==null && data.schedules!==null){
                    options_schedules = data.schedules.map((schedule)=>{
                        return {
                            value:schedule.id,
                            label:schedule.time,
                            data:schedule
                        }
                    });
                }
                this.setState(function (prevState) {
                    return {
                        sale: {
                            ...prevState.sale,
                            service_data:data?data.data:null,
                            service_rate:data?data.service_rate.id:null,
                            service_rate_data:data?data.service_rate:null,
                            schedule:null,
                            schedule_time:"",
                            schedule_max:0,
                            schedule_reserved:0,
                            time:null,
                        },
                        options_schedules:options_schedules
                    };
                },()=>this.sale_total_balance());
            }
            if(event.name==="schedule"){
                let schedule_time=data?data.label:"",
                    schedule_reserved=data?data.data.reserved:0,
                    schedule_max=data?data.data.limit:0,
                    options_schedule_pickups = data?data.data.pick_ups:[];
                this.setState(function (prevState) {
                    return {
                        sale: {
                            ...prevState.sale,
                            schedule_time:schedule_time,
                            schedule_reserved:schedule_reserved,
                            schedule_max:schedule_max,
                            time:schedule_time,
                        },
                        options_schedule_pickups:options_schedule_pickups
                    };
                });
            }
        });
    }

    async handleSubmit(e){
        e.preventDefault();
        if(this.state.id !== null && this.state.url_payment !== null){
            window.location.replace(`${ApiSalesUrl}sale_token/payment/${this.state.id}/`);
        } else {
            createSaleToken(this.state.sale).then(res => {
                window.location.replace('/sale_page/'+res.uuid);
                this.setState(function (prev_State) {
                    return {
                        id:res.uuid,
                        sale:new Sale(res.sale),
                        url_payment:res.url
                    };
                },()=>{window.location.replace(res.url)});
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
            });
            
        }
    }

    openSale =() => {
        try {
            window.open(`/api/sales/print_sale_token/${this.state.id}/`, "_blank");
        } catch (exception) {
            console.log(exception);
        }
    }

    componentDidMount() {
        console.log(this.props.params)
        let id = this.props.params.id?this.props.params.id:null;
        if(id!==null){
            this.load_uid_sale(id);
        } else {
            this.reset();
        }
		
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
            if(this.props.params.id)
			    this.load_uid_sale(this.props.params.id);
            else
                this.reset();
		}
        console.log(this.state.sale);
	}

    reset(){
        this.setState({
            id:null,
            sale: new Sale({
                id:null,
                status:"P",
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
            discount_auth: null,
            discount_no_auth: null,
        });
        axios.get(`${ApiSalesUrl}sale/date/`).then(res => {
            this.setState(function (prev_State) {
                return {
                    sale: {
                        ...prev_State.sale,
                        sale_date:res.data,
                    },
                }
            });
        });
    }

    load_uid_sale(uid){
        getTokenSale(uid).then(res => {
            this.setState(
                (prev_State) =>{
                return {
                    id:uid,
                    sale:new Sale(res.sale),
                    url_payment:res.url,
                    exchange_rate:res.exchange_rate
                };
            },()=>{
                this.load_services();
                this.sale_total_balance();
            });
        });
    }

    load_data(){
        axios.get(`${ApiSalesUrl}sale_token/create_data/${this.state.sale.property}/`).then(res => {
            this.setState(function (prev_State) {
                return {
                    sale: {
                        ...prev_State.sale,
                        user_extension:res.data.user_extension.id,
                        user_extension_name:res.data.user_extension.user.username,
                        representative:res.data.representative.id,
                        representative_name:res.data.representative.name,
                        sale_type:res.data.sale_type.id,
                        sale_type_data:res.data.sale_type,
                        client_type:res.data.client_type.id,
                        client_type_data:res.data.client_type,
                        hotel:res.data.hotel.id,
                        hotel_name:res.data.hotel.name,
                    },
                    exchange_rate:res.data.exchange_rate,
                }
            });
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
        });
    }

    load_services(){
        if(this.state.sale.sale_date !== "" && this.state.sale.property !== null){
            axios.get(`${ApiSalesUrl}sale_token/services_sales/${this.state.sale.property}/?service_date=${this.state.sale.service_date}&adults=${this.state.sale.adults}&childs=${this.state.sale.childs}`
            ).then(res => {
                this.setState({
                    services:res.data,
                    options_services:res.data.map((data)=>{
                        return {
                            value:data.service.id,
                            label:this.state.lang==="en"?data.service.name_online_sale_en:data.service.name_online_sale_es,
                            data:data.service,
                            schedules:data.schedules,
                            service_rate:data.service_rate,
                        }
                    })
                },()=>{
                    if(this.state.id!==null){
                        let options_schedules = [],
                            schedules = this.state.services.find((service_data)=>service_data.service.id===this.state.sale.service).schedules
                        if(schedules!==null){
                            options_schedules = schedules.map((schedule)=>{
                                return {
                                    value:schedule.id,
                                    label:schedule.time,
                                    data:schedule
                                }
                            });
                        }
                        this.setState(function (prevState) {
                            return {
                                options_schedules:options_schedules
                            };
                        },()=>this.sale_total_balance());
                    }
                });
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
            this.setState({
                sale_total:sale_total,
            });
        } else {
            this.setState({
                sale_total:0,
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
            case "property":
                options = this.state.options_properties;
                break;
            case "service":
                options = this.state.options_services;
                break;
            case "schedule":
                options = this.state.options_schedules;
                break;
        }
        value = options.find((option)=>option.value===this.state.sale[field]);
        return value!==undefined?value:null;
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

    render(){
        const { lang, id, sale, sale_total, options_services, options_schedules, options_properties, exchange_rate, modal, modal_service } = this.state;
        const select_option_service = this.getOptionValue("service");
        const select_option_property = this.getOptionValue("property");
        const select_option_schedule = this.getOptionValue("schedule");
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
                <ButtonGroup>
                    <Button size='sm' onClick={()=>this.changeLanguage("es")} disabled={lang=="es"}>Español</Button>
                    <Button size='sm' onClick={()=>this.changeLanguage("en")} disabled={lang=="en"}>English</Button>
                </ButtonGroup>
                <Form onSubmit={this.handleSubmit} id="sale-form">
                    <Row className='border-bottom'>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="sale_date" size='sm'>{lang=="en"?"Sale date":"Fecha venta"}</Label>
                                <Input type="date"
                                    bsSize="sm"
                                    name="sale_date"
                                    value={sale.sale_date.substring(0, 10)}
                                    disabled/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="service_date" size='sm'>{lang=="en"?"Service date":"Fecha de servicio"}</Label>
                                <Input type="date"
                                    bsSize="sm"
                                    name="service_date"
                                    min={sale.sale_date.substring(0, 10)}
                                    value={sale.service_date}
                                    onChange={this.onChangeValue}
                                    required
                                    disabled={sale.id!==null}
                                    invalid={!this.validDate(sale.sale_date.substring(0, 10),sale.service_date)}/>
                                {this.validDate(sale.sale_date.substring(0, 10),sale.service_date)?<></>:
                                <FormFeedback>
                                    La fecha no es valida para venta
                                </FormFeedback>}
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label size='sm'>Hotel</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_properties}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="property"
                                    value={select_option_property}
                                    onChange={this.onChangeSelectValue}
                                    required
                                    isDisabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={1}>
                            <FormGroup>
                                <Label size='sm'>{lang=="en"?"Adults":"Adultos"}</Label>
                                <Input type="number" 
                                    name="adults"
                                    bsSize="sm"
                                    value={sale.adults}
                                    onChange={this.onChangeValue}
                                    min={0}
                                    step={1}
                                    required
                                    disabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={1}>
                            <FormGroup>
                                <Label size='sm'>{lang=="en"?"Childs":"Menores"}</Label>
                                <Input type="number" 
                                    name="childs"
                                    bsSize="sm"
                                    value={sale.childs}
                                    onChange={this.onChangeValue}
                                    min={0}
                                    step={1}
                                    required
                                    disabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={1}>
                            <Label size='sm'>T/C USD <b>{exchange_rate?exchange_rate.usd_currency:0}</b></Label>
                        </Col>
                        <Col sm={1}>
                            <Label size='sm'>T/C Euro <b>{exchange_rate?exchange_rate.euro_currency:0}</b></Label>
                        </Col>
                    </Row>
                    {sale.property!==null&&sale.service_date!==""?<>
                    <Row className='border-bottom'>
                        <Col sm={5}>
                            <FormGroup>
                                <Label size='sm'>{lang=="en"?"Service":"Servicio"}</Label>
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
                                        isDisabled={sale.id!==null}/>
                                    <Button color='secondary'
                                        size='sm'
                                        onClick={(e)=> this.onServiceData()}
                                        disabled={sale.service===null}>
                                        <i className="bi bi-bus-front"></i>
                                    </Button>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label size='sm'>{lang=="en"?"Schedule":"Horario"}</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_schedules}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="schedule"
                                    value={select_option_schedule}
                                    onChange={this.onChangeSelectValue}
                                    required={options_schedules.length>0}
                                    isDisabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="pick_up" size='sm'>Pick Up</Label>
                                <Input type="text"
                                    bsSize="sm"
                                    name="pick_up"
                                    value={this.getPickUp()}
                                    disabled/>
                            </FormGroup>
                        </Col>
                    </Row></>:<></>}
                    {sale.service!==null&&(sale.adults>0||sale.childs>0)?<>
                    <Row className='border-bottom'>
                        <Col sm={3}>
                            <FormGroup>
                                <Label for="name_pax" size='sm'>{lang=="en"?"Pax Name":"Nombre Pax"}</Label>
                                <Input type="text" 
                                    name="name_pax"
                                    bsSize="sm"
                                    value={sale.name_pax}
                                    onChange={this.onChangeValue}
                                    required
                                    disabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label for="email" size='sm'>{lang=="en"?"Email":"Correo electronico"}</Label>
                                <Input type="text" 
                                    name="email"
                                    bsSize="sm"
                                    value={sale.email}
                                    onChange={this.onChangeValue}
                                    disabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="room" size='sm'>{lang=="en"?"Room":"Habitación"}</Label>
                                <Input type="text" 
                                    name="room"
                                    bsSize="sm"
                                    value={sale.room}
                                    onChange={this.onChangeValue}
                                    disabled={sale.id!==null}/>
                            </FormGroup>
                        </Col>
                    </Row></>:<></>}
                    {sale.name_pax!=""&&sale.email!==""?<>
                    <Row className='border-bottom'>
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="comments" size='sm'>{lang=="en"?"Comments":"Comentarios"}</Label>
                                <Input type="textarea" 
                                    name="comments"
                                    bsSize="sm" 
                                    value={sale.comments}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                    </Row></>:<></>}
                    <FormGroup className='pt-2'>
                        <ButtonGroup>
                            <Button color="success" type="submit" form='sale-form' disabled={sale.status!=='P'||sale.sale_type===null||sale.client_type===null||sale.service_rate===null}>
                                {lang=="en"?"Proceed to payment":"Proceder al pago"} ${this.currencyFormat(sale_total)}
                            </Button>
                            {id?
                            //<Link to={}>
                            <Button color="info" disabled={sale.status!=="A"} onClick={this.openSale}>
                                {lang=="en"?"Print coupon":"Imprimir cupon"}
                            </Button>
                            :<></>}
                        </ButtonGroup>
                    </FormGroup>
               </Form>
               <ModalAlert handleClose={this.handleClose}  handleCloseError={this.handleCloseError} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
               <ModalServiceData handleClose={this.handleServiceClose} data={modal_service} />
        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <SaleTokenForm {...props} params = {params} history={history} />;
}