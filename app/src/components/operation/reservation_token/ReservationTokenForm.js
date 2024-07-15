import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Table, InputGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { Reservation, ReservationService, updateTokenReservation, getTokenReservation, sendReservationEmail, createTokenReservation } from '../ReservationModel';
import { ApiUrl, ApiOperationsUrl } from '../../../constants/api/site';
import axios from "axios";
import ModalAlert from '../../ModalAlert';
import ModalOperationReservationToken from './ModalOperationReservationToken';
import moment from 'moment';
import ModalOperationOperaInformationReservation from './ModalOperationOperaInformationReservation';
class ReservationTokenForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state={
            id: null,
            property:null,
            user_extension:props.user_extension,
            adults:0,
            minors:0,
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
            reservation_service_default:null,
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
            },
            modal_opera_filter:{
                params:{
                    opera_code:"",
                },
                user_extension:props.user_extension,
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
            updateTokenReservation(this.state.id, this.state.reservation)
                .then(res => {
                    this.reset(this.state.id);
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
        } else{
            e.preventDefault();
            createTokenReservation(this.state.reservation)
                .then(res => {
                    this.reset(res.uuid);
                    this.props.history('/reservation_page/update/'+res.uuid+'/')
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
        if (id !== null && id !== undefined){
            getTokenReservation(id).then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        reservation:new Reservation(res.data),
                        modal_operation: {
                            ...prev_State.modal_operation,
                            token:id,
                        },
                        options_contacts:res.contacts.map((contact)=>{return {value:contact.id,label:contact.name}}),
                        options_departments_cecos:res.departments_cecos.map((department_cecos)=>{return {value:department_cecos.id,label:department_cecos.name}}),
                        options_sale_types:res.sale_types.map((sale_type)=>{return {value:sale_type.id,label:sale_type.name,is_inner_bussiness:sale_type.is_inner_bussiness}})
                    };
                });
                axios.get(`${ApiOperationsUrl}reservation_token/date/`).then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal_operation:{
                                ...prev_State.modal_operation,
                                reservation_date:res.data,
                            }
                        }
                    });
                });
            });
        } else {
            this.setState(
                (prev_State) =>{
                return {
                    id:null,
                    adults:0,
                    minors:0,
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
                    reservation_service_default:null,
                        };
                    });
        }
    }

    handleReservationOpera = (reservation,reservation_service_default) => {
        if(reservation.id!==null){
            window.alert("Ya existe una reservacion con esa reserva opera");
        } else {
            this.setState(function (prevState) {
                return {
                    reservation:new Reservation(reservation),
                    reservation_service_default:reservation_service_default
                };
            });
            axios.get(`${ApiOperationsUrl}reservation_token/date/`).then(res => {
                this.setState(function (prev_State) {
                    return {
                        modal_operation:{
                            ...prev_State.modal_operation,
                            reservation_date:res.data,
                        }
                    }
                });
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
        var new_reservation_service = Object.assign(new ReservationService({
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
        }), this.state.reservation_service_default)

        this.setState(function (prev_State) {
            return {
                modal_operation:{
                    ...prev_State.modal_operation,
                    reservation_service: new_reservation_service
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
                    property:this.state.reservation.property,
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

    render(){
        const { id,reservation, modal, modal_operation, modal_opera_filter } = this.state;
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
                    <Col sm={1}>
                        <FormGroup>
                            <Label for="id" size='sm'>Referencia#</Label>
                            <Input type="text"
                                bsSize="sm"
                                name="id"
                                value={reservation.id?reservation.id.toString().padStart(6, '0'):""}
                                disabled/>
                        </FormGroup>
                    </Col>
                    <Col sm={3}>
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
                            <Label for="country" size='sm'>Pais</Label>
                            <Input type="text" 
                                name="country"
                                bsSize="sm"
                                value={reservation.country}
                                onChange={this.onChangeValue}
                                required/>
                        </FormGroup>
                    </Col>
                </Row>
                <Row className='border-bottom border-top pt-3'>
                    <Col sm={3}>
                        {id===null?
                        <Button color="primary" onClick={this.handleNewReservationService} disabled={id!==null}>
                            <i className="bi bi-plus"></i> Agregar
                        </Button>:<></>}
                    </Col>
                    <Col sm={12}>
                        <p id="before-table"></p>
                        <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                            <thead>
                                <tr>
                                    <th width={"12%"}>Tipo</th>
                                    <th width={"15%"}>Fecha</th>
                                    <th width={"25%"}>Servicio</th>
                                    <th width={"25%"}>Hotel</th>
                                    <th width={"10%"}>Cantidad</th>
                                    <th width={"13%"}></th>
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
                                        <td className='text-center'>
                                            {id===null?
                                            <ButtonGroup>
                                                <Button color="info"
                                                    size='sm'
                                                    onClick={(e)=> this.onEditReservationService(reservation_service,index)}
                                                    disabled={id!==null}>
                                                    <i className="bi bi-pencil-fill"></i>
                                                </Button>
                                                <Button color="warning" 
                                                    size='sm'
                                                    onClick={(e)=> this.onDeleteReservationService(reservation_service,index)}
                                                    disabled={id!==null}>
                                                    <i className="bi bi-trash-fill"></i>
                                                </Button>
                                            </ButtonGroup>:<></>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                {id===null?
                <FormGroup>
                    <Button color="primary" type="submit" form='reservation-form' disabled={reservation.opera_code==""||id!==null}>
                        <i className="bi bi-save"></i> Guardar
                    </Button>
                </FormGroup>:<></>}
            </Form>
            <ModalAlert handleClose={this.handleClose} data={modal}  />
            <ModalOperationReservationToken handleClose={this.handleCloseReservationService} handleSave={this.handleSaveReservationService} data={modal_operation}/>
            <ModalOperationOperaInformationReservation handleSave={this.handleReservationOpera} data={modal_opera_filter} open={reservation.opera_code===""} />
        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams();
    const datosUsuario = window.datosUsuario;
    var tempProps = JSON.parse(JSON.stringify(props));
    tempProps.user_extension = datosUsuario;
    Object.preventExtensions(tempProps);
    return <ReservationTokenForm {...tempProps} params = {params} history={history} />;
}