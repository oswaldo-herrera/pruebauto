import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Table, InputGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { Reservation, ReservationService, createReservation, updateReservation, getReservation, sendReservationEmail } from './ReservationModel';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import { getProfile, Profile, User } from '../user/UserModel';
import ModalOperationReservation from './ModalOperationReservation';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import moment from 'moment';
import ModalOperationFilterListOperaReport from './ModalOperationFilterListOperaReport';
class ReservationForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state={
            id: null,
            reservation: new Reservation({
                id:null,
                opera_code:"",
                pax:"",
                user_extension:null,
                user_extension_name:"",
                contact:null,
                country:"",
                email:"",
                department_cecos:null,
                memberships:"",
                address:"",
                reservation_date:"",
                sale_type:null,
                amount:0,
                comments:"",
                property:null,
                reservation_services:[]
            }),
            options_contacts: [],
            options_departments_cecos: [],
            options_sale_types: [],
            modal:{
                title: "Reservación",
                type: 'success',
                message: null,
            },
            modal_operation:{
                reservation_service:null,
                reservation_date:null,
                user_extension:new Profile({
                    id:null,
                    user: new User(null,"","","","","",false,false),
                    properties:[],
                    permissions:[]
                }),
            },
            modal_properties:{
                type:'property',
                isopen:false,
                value:null
            },
            modal_opera_filter:{
                open:false,
                params:{
                    opera_code:"",
                    domain:"HRCUN",
                }
            }
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				reservation: {
					...prevState.reservation,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
                reservation: {
					...prevState.reservation,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
                reservation: {
                    ...prevState.reservation,
                    [event.name]:value,
                },
		    };
		});
    }

    handleSubmit(e){
        e.preventDefault();
        if (this.state.id !== null) {
            e.preventDefault();
            updateReservation(this.state.id, this.state.reservation)
                .then(res => {
                    this.reset(res.id);
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                        };
                    });
                }).catch(error => {
                    window.alert(error.response.data.error)
                });
        } else {
            createReservation(this.state.reservation)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Guardado exitoso!",
                            },
                        };
                    });
                    this.props.history('/reservation/'+res.id)
                }).catch(error => {
                    window.alert(error.response.data.error)
                });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
		this.reset(id);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id);
		}
        console.log(this.state.reservation);
	}

    reset(id){
        if (id !== null){
            getReservation(id).then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        reservation:new Reservation(res),
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.property,
                        },
                        modal_operation: {
                            ...prev_State.modal_operation,
                            property:res.property,
                        },
                    };
                },()=>this.options_load());
                axios.get(`${ApiOperationsUrl}reservation/date/`).then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal_operation:{
                                ...prev_State.modal_operation,
                                reservation_date:res.data,
                            }
                        }
                    });
                });
                getProfile().then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal_operation:{
                                ...prev_State.modal_operation,
                                user_extension: new Profile(res)
                            },
                        }
                    });
                });
            });
        } else {
            this.setState({
                id:null,
                reservation: new Reservation({
                    id:null,
                    opera_code:"",
                    pax:"",
                    user_extension:null,
                    user_extension_name:"",
                    contact:null,
                    country:"",
                    email:"",
                    department_cecos:null,
                    address:"",
                    reservation_date:"",
                    sale_type:null,
                    amount:0,
                    transportation_type:"ow",
                    comments:"",
                    property:null,
                    reservation_services:[]
                }),
                modal_properties:{
                    type:'property',
                    isopen:true,
                    filter:"OP",
                    value:null
                },
            });
            axios.get(`${ApiOperationsUrl}reservation/date/`).then(res => {
                this.setState(function (prev_State) {
                    return {
                        reservation: {
                            ...prev_State.reservation,
                            reservation_date:res.data,
                        },
                        modal_operation:{
                            ...prev_State.modal_operation,
                            reservation_date:res.data,
                        }
                    }
                });
            },()=>{this.options_load()});
            getProfile().then(res => {
                this.setState(function (prev_State) {
                    return {
                        reservation: {
                            ...prev_State.reservation,
                            user_extension:res.id,
                            user_extension_name:res.user.username,
                        },
                        modal_operation:{
                            ...prev_State.modal_operation,
                            user_extension: new Profile(res)
                        },
                    }
                });
            });
        }
    }
    
    options_load(){
        axios.get(`${ApiOperationsUrl}contacts/?limit=500`)
        .then(res => {
            this.setState({
                options_contacts:res.data.results.map((contact)=>{return {value:contact.id,label:contact.name}})
            });
        }).catch(error => {
            this.catchErrorCatalog(error,"Contactos");
        });
        axios.get(`${ApiUrl}general/departmentscecos/?limit=500`)
        .then(res => {
            this.setState({
                options_departments_cecos:res.data.results.map((department_cecos)=>{return {value:department_cecos.id,label:department_cecos.name}})
            });
        }).catch(error => {
            this.catchErrorCatalog(error,"Departamentos cecos");
        });
        axios.get(`${ApiUrl}general/saletypes/?limit=500&property=${this.state.reservation.property}&ordering=name`)
        .then(res => {
            this.setState({
                options_sale_types:res.data.results.map((sale_type)=>{return {value:sale_type.id,label:sale_type.name,is_inner_bussiness:sale_type.is_inner_bussiness}})
            });
        }).catch(error => {
            this.catchErrorCatalog(error,"Tipos de ventas");
        });
        
    }

    catchErrorCatalog(error,catalogo){
        if (this.state.reservation.property===null){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message:  "Propiedad: No tienes asignada una propiedad para esta reserva",
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
            case "contact":
                options = this.state.options_contacts;
                break;
            case "department_cecos":
                options = this.state.options_departments_cecos;
                break;
            case "sale_type":
                options = this.state.options_sale_types;
                break;
        }
        value = options.find((option)=>option.value===this.state.reservation[field]);
        return value;
    }

    getOptionInnerBussiness = () =>{
        let options = this.state.options_sale_types;
        let value = options.find((option)=>option.value===this.state.reservation.sale_type);
        return value?value.is_inner_bussiness:false;
    }

    onClickChangePassword = () => {
        this.setState(function (prev_State) {
            return {
                change_password: {
                    ...prev_State.change_password,
                    open: true,
                },
            };
        });
    }

    handleNewReservationService = (e) => {
        this.setState(function (prev_State) {
            return {
                modal_operation:{
                    ...prev_State.modal_operation,
                    reservation_service: new ReservationService({
                        id:null,
                        reservation:this.state.reservation.id,
                        asignment:false,
                        date:"",
                        confirmation:false,
                        service:null,
                        service_name:"",
                        origin:null,
                        origin_name:"",
                        destination:null,
                        destination_name:"",
                        room:"",
                        transfer_type:"ARRIVALS",
                        adults:0,
                        childs:0,
                        operation_type:null,
                        flight:null,
                        flight_field:'',
                        flight_code:'',
                        flight_time:'',
                        real_flight_time:'',
                        pick_up_time:null,
                        pick_up_time_data:'',
                        real_pick_up_time:'',
                        comments:"",
                        no_show:"none",
                        unit:null,
                        valid_sale:null,
                    })
                }
            }
        });
	}

    onDeleteReservationService(data,index){
        if(window.confirm("¿Desea eliminar '"+data.service_name+"' de servicios?")){
            let reservation_services = this.state.reservation.reservation_services;
            reservation_services.splice(index, 1);
            this.setState(function (prev_State) {
                return {
                    reservation:{
                        ...prev_State.reservation,
                        reservation_services:reservation_services
                    }
                };
            });
        }
        
	}

    handleCloseReservationService = () => {
        this.setState(function (prev_State) {
            return {
                modal_operation:{
                    ...prev_State.modal_operation,
                    index:null,
                    reservation_service:null
                }
            };
        });
    }

    onEditReservationService(reservation_service,index){
        this.setState(function (prev_State) {
            return {
                modal_operation:{
                    ...prev_State.modal_operation,
                    index:index,
                    reservation_service:Object.assign({},reservation_service)
                }
            };
        });
	}

    handleSaveReservationService = (data,index) => {
        let reservation_services = this.state.reservation.reservation_services;
        if(index!==null)
            reservation_services[index] = new ReservationService(data);
        else
            reservation_services.push(new ReservationService(data))
        this.setState(function (prevState) {
            return {
                reservation: {
                    ...prevState.reservation,
                    reservation_services:reservation_services
                },
                modal_operation:{
                    ...prevState.modal_operation,
                    index:null,
                    reservation_service:null
                }
            };
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
                    modal_operation: {
                        ...prev_State.modal_operation,
                        property:value
                    },
                    modal_opera_filter:{
                        ...prev_State.modal_opera_filter,
                        property:value
                    },
                    reservation:{
                        ...prev_State.reservation,
                        property:value
                    }
                };
            }
        ,()=>{this.options_load()});
	}

    onFilterOperaModal = () => {
        this.setState(function (prev_State) {
            return {
                modal_opera_filter:{
                    ...prev_State.modal_opera_filter,
                    open: true,
                    params:{
                        ...prev_State.modal_opera_filter.params,
                        opera_code:this.state.reservation.opera_code
                    }
                }
            };
        });
    }

    handleSaveOpera = (params) => {
        if(params.id!==null){
            if(window.confirm("Ya existe una reservacion con esa reserva opera, ¿Desea ir a esa reservacíon?")){
                this.props.history('/reservation/'+params.id);
            }
        } else {
            this.setState(function (prevState) {
                return {
                    modal_opera_filter:{
                        ...prevState.modal_opera_filter,
                        open: false,
                    },
                    reservation:new Reservation(params),
                    modal_properties: {
                        ...prevState.modal_properties,
                        value:params.property,
                    },
                };
            });
        }
	}

    handlePropertyClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: false,
                },
                modal: {
                        ...prev_State.modal,
                        type:"error",
                        message:  "Propiedad: No tienes asignada una propiedad para esta reserva",
                    },
            };
        });
	}

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                modal_opera_filter:{
                    ...prev_State.modal_opera_filter,
                    open: false
                }
            };
        });
    }

    downloadDocument(){
        var url = `${ApiOperationsUrl}reservation_confirmation_report_download/${this.state.id}/`;
        window.open(url, "_blank");
        
    }

    sendDocument(){
        sendReservationEmail(this.state.id).then(res => {
            let emails = res.email.split(";"),
                text = "";
            emails.forEach(email => {
                text += "\n -" + email
            });
            alert("Se ha enviado el correo a:" + text);
        })
    }

    getFlightTime(reservation_service){
        if(reservation_service.flight!==null){
            if(reservation_service.real_flight_time!==null&&reservation_service.real_flight_time!==""){
                return reservation_service.flight_code+"//"+reservation_service.real_flight_time;
            } else {
                return reservation_service.flight_code+"//"+reservation_service.flight_time;
            }
        }
        return ""
    }

    render(){
        const { id,reservation,options_contacts, options_departments_cecos, options_sale_types, modal, modal_opera_filter, modal_operation,modal_properties } = this.state;
        const select_option_contact = this.getOptionValue("contact");
        const select_option_department_cecos = this.getOptionValue("department_cecos");
        const select_option_sale_type = this.getOptionValue("sale_type");
        const select_option_sale_type_interdepartamental = this.getOptionInnerBussiness();
        const trasfer_type = {
            DEPARTURES:'Salida',
            ARRIVALS:'Llegada',
            INTERHOTEL:'InterHotel',
        }
        const customSelectStyles = {
            control: (base) => ({
                ...base,
                height: 30,
                minHeight: 30,
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
            menu: (provided) => ({
                ...provided,
                
            }),
        };
        return(<>
                <Form onSubmit={this.handleSubmit} id="reservation-form">
                    <Row>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="id" size='sm'>Referencia#</Label>
                                <Input type="text"
                                    bsSize="sm"
                                    name="id"
                                    value={reservation.id?reservation.id.toString().padStart(6, '0'):""}
                                    disabled/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label for="pax" size='sm'>Pasajero</Label>
                                <Input type="text" 
                                    name="pax"
                                    bsSize="sm"
                                    value={reservation.pax}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="opera_code" size='sm'>Reserva opera</Label>
                                <InputGroup>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="opera_code"
                                        value={reservation.opera_code}
                                        onChange={this.onChangeValue}/>
                                    <Button size='sm'
                                        onClick={(e)=> this.onFilterOperaModal()}
                                        disabled={id!==null}>
                                        <i className="bi bi-bus-front"></i>
                                    </Button>
                                </InputGroup>
                                
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="reservation_date" size='sm'>Fecha reservación</Label>
                                <Input type="date"
                                    bsSize="sm"
                                    name="reservation_date"
                                    value={reservation.reservation_date}
                                    disabled/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="user_extension_name" size='sm'>Usuario</Label>
                                <Input type="text"
                                    bsSize="sm"
                                    name="user_extension_name"
                                    value={reservation.user_extension_name}
                                    disabled/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label for="country" size='sm'>Pais</Label>
                                <Input type="text" 
                                    name="country"
                                    bsSize="sm"
                                    value={reservation.country}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label for="email" size='sm'>Correo</Label>
                                <Input type="text" 
                                    name="email"
                                    bsSize="sm"
                                    value={reservation.email}
                                    onChange={this.onChangeValue}
                                    required/>
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
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label size='sm'>Contacto</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_contacts}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="contact"
                                    value={select_option_contact}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        
                        {select_option_sale_type_interdepartamental?
                        <>
                        <Col sm={4}>
                            <FormGroup>
                                <Label size='sm'>Departamento CECOS</Label>
                                <Select
                                    styles={customSelectStyles}
                                    options={options_departments_cecos}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="department_cecos"
                                    value={select_option_department_cecos}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label for="email" size='sm'>Membresías</Label>
                                <Input type="text" 
                                    name="memberships"
                                    bsSize="sm"
                                    value={reservation.memberships}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="address" size='sm'>Dirección</Label>
                                <Input type="textarea" 
                                    name="address"
                                    bsSize="sm" 
                                    placeholder="Dirección" 
                                    value={reservation.address}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        </>
                        :<Col></Col>}
                    </Row>
                    <Row className='border-bottom border-top pt-3'>
                        <Col sm={3}>
                            <Button color="primary" onClick={this.handleNewReservationService}>
                                <i className="bi bi-plus"></i> Agregar
                            </Button>
                        </Col>
                        <Col sm={12}>
                            <p id="before-table"></p>
                            <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                                <thead>
                                    <tr>
                                        <th width={"8%"}>Tipo</th>
                                        <th width={"12%"}>Fecha</th>
                                        <th width={"23.5%"}>Servicio</th>
                                        <th width={"23.5%"}>Hotel</th>
                                        <th width={"5%"}>Px</th>
                                        <th width={"20%"}>Información</th>
                                        <th width={"8%"}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservation.reservation_services.map((reservation_service,index) => (
                                        <tr key={index}>
                                            <td>{trasfer_type[reservation_service.transfer_type]}</td>
                                            <td>{moment(reservation_service.date).format('LL')}</td>
                                            <td>{reservation_service.service_name}</td>
                                            <td>{reservation_service.origin!==null?reservation_service.origin_name:reservation_service.destination_name}</td>
                                            <td>{reservation_service.adults}.{reservation_service.childs}</td>
                                            <td>{this.getFlightTime(reservation_service)}</td>
                                            <td className='text-center'>
                                                <ButtonGroup>
                                                    <Button color="info"
                                                        size='sm'
                                                        onClick={(e)=> this.onEditReservationService(reservation_service,index)}>
                                                        <i className="bi bi-pencil-fill"></i>
                                                    </Button>
                                                    <Button color="warning" 
                                                        size='sm'
                                                        onClick={(e)=> this.onDeleteReservationService(reservation_service,index)}>
                                                        <i className="bi bi-trash-fill"></i>
                                                    </Button>
                                                </ButtonGroup>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                    <Row >
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="amount" size='sm'>Comentarios carta confirmación</Label>
                                <Input type="textarea"
                                    name="amount"
                                    bsSize="sm" 
                                    placeholder="Comentarios carta confirmación" 
                                    value={reservation.amount}
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
                                    value={reservation.comments}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <ButtonGroup>
                            <Button color="primary" type="submit" form='reservation-form'>
                                <i className="bi bi-save"></i> Guardar
                            </Button>
                            <Button color="success" onClick={()=>this.downloadDocument()}
                            disabled={id==null}>
                                <i className="bi bi-cloud-arrow-down-fill"></i> Carta confirmación
                            </Button>
                            <Button color="info" onClick={()=>this.sendDocument()}
                            disabled={id==null||reservation.email==""}>
                                <i className="bi bi-envelope-fill"></i> Enviar
                            </Button>
                        </ButtonGroup>
                    </FormGroup>
               </Form>
               <ModalAlert handleClose={this.handleClose} data={modal}  />
               <ModalPropertiesAsignment handleAsignment={this.handleAsignment} handleClose={this.handlePropertyClose} data={modal_properties}  />
               <ModalOperationReservation handleClose={this.handleCloseReservationService} handleSave={this.handleSaveReservationService} data={modal_operation}/>
               <ModalOperationFilterListOperaReport handleClose={this.handleClose} handleSave={this.handleSaveOpera} data={modal_opera_filter}/>
        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ReservationForm {...props} params = {params} history={history} />;
}