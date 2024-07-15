import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, FormFeedback } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../../constants/api/site';
class ModalOperationReservationToken extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeSelectFlightValue = this.onChangeSelectFlightValue.bind(this);
        this.onChangeValueCheckboxNoShow = this.onChangeValueCheckboxNoShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            index: null,
            token:null,
            property:null,
            origin: null,
            origin_name: "",
            destination: null,
            destination_name: "",
            service: null,
            service_name: "",
            reservation_service: null,
            reservation_date:null,
            options_hotels:[],
            options_flights:[],
            flights:[],
        }
    }

    onChangeValue(event) {
        let value = event.target.value;
		this.setState(function (prevState) {
			return {
				reservation_service: {
					...prevState.reservation_service,
                    [event.target.name]:value,
				},
			};
		},()=>{
            if(event.target.name==="date"){
                this.setState(function (prevState) {
                    return {
                        reservation_service: {
                            ...prevState.reservation_service,
                            flight:null,
                            flight_field:'',
                            flight_time:'',
                            pick_up_time:null,
                            pick_up_time_data:''
                        },
                    };
                },()=>{
                    this.options_load();
                });
            } else if(event.target.name==="real_flight_time"){
                this.pick_up_load();
            } else if(event.target.name==="transfer_type"){
                if(value=="DEPARTURES"){
                    this.setState(function (prevState) {
                        return {
                            reservation_service: {
                                ...prevState.reservation_service,
                                origin:this.state.hotel,
                                origin_name:this.state.hotel_name,
                            },
                        };
                    },()=>{
                        this.options_load();
                    });
                } else {
                    this.setState(function (prevState) {
                        return {
                            reservation_service: {
                                ...prevState.reservation_service,
                                destination:this.state.hotel,
                                destination_name:this.state.hotel_name,
                            },
                        };
                    },()=>{
                        this.options_load();
                    });
                }
                
            }
        });
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
                reservation_service: {
					...prevState.reservation_service,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
        let name = data?data.label:"";
        this.setState(function (prevState) {
            return {
                reservation_service: {
                    ...prevState.reservation_service,
                    [event.name]:value,
                    [event.name+'_name']:name,
                },
            };
        },()=>{
            if(event.name==="service"||event.name==="origin"||event.name==="destination")
                this.options_load();
        });
    }

    onChangeSelectFlightValue(data, event) {
        let value = data?data.value:null;
        let name = data?data.label:"";
        this.setState(function (prevState) {
            return {
                reservation_service: {
                    ...prevState.reservation_service,
                    [event.name]:value,
                    [event.name+'_code']:name,
                },
            };
        },()=>{
            let flight_data = data?data.data:null;
            if(flight_data!=null){
                this.setState(function (prevState) {
                    return {
                        reservation_service: {
                            ...prevState.reservation_service,
                            flight_field:flight_data.field,
                            flight_time:flight_data[flight_data.field]
                        },
                    };
                },()=>{
                    this.pick_up_load();
                });
            } else {
                this.setState(function (prevState) {
                    return {
                        reservation_service: {
                            ...prevState.reservation_service,
                            flight_field:'',
                            flight_time:'',
                            pick_up_time:null,
                            pick_up_time_data:''
                        },
                    };
                });
            }
            
        });
    }

    onChangeValueCheckboxNoShow(event) {
        var value = event.target.name;
        if(!event.target.checked){
            value = "none"
        }
        this.setState(function (prevState) {
            return {
                reservation_service: {
                    ...prevState.reservation_service,
                    no_show:value,
                },
            };
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.reservation_service !== new_data.reservation_service)
			return true;
        if(prev_data.index !== new_data.index)
			return true;
        if(prev_data.property !== new_data.property)
			return true;
        if(prev_data.token !== new_data.token)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)) {
			this.reset(this.props.data);
		}
	}

	reset(data){
        let reservation_service = data.reservation_service!==undefined?data.reservation_service:this.state.reservation_service;
        let reservation_date = data.reservation_date!==undefined?data.reservation_date:this.state.reservation_date;
        let index = data.index!==undefined?data.index:this.state.index;
        let token = data.token!==undefined?data.token:this.state.token;
        let property = data.property!==undefined?data.property:this.state.property;
        this.setState({
            reservation_service: reservation_service,
            reservation_date: reservation_date,
            index: index,
            token: token,
            property: property,
            hotel: reservation_service?reservation_service.destination:null,
            hotel_name: reservation_service?reservation_service.destination_name:"",
            service: reservation_service?reservation_service.service:null,
            service_name: reservation_service?reservation_service.service_name:"",
        },()=>this.options_load());
	}

    options_load(){
        if(this.state.reservation_service!==null){
            if(this.state.reservation_service.service!==null){
                this.setState({
                    options_hotels:[{value:this.state.hotel,label:this.state.hotel_name}]
                });
                if(this.state.reservation_service.transfer_type!=="INTERHOTEL"&&this.state.reservation_service.date!==""){
                    axios.get(`${ApiOperationsUrl}reservation_token/operation_flights/`,{
                        params: {
                            token:this.state.token,
                            property:this.state.property,
                            service:this.state.reservation_service.service,
                            date:this.state.reservation_service.date,
                            transfer_type:this.state.reservation_service.transfer_type
                        }
                    })
                    .then(res => {
                        this.setState({
                            options_flights:res.data.results.map((flight)=>{return {value:flight.id,label:flight.code,data:flight}})
                        });
                    });
                }
            }
        }  
    }

    pick_up_load(){
        if(this.state.property!==null&&this.state.reservation_service!==null){
            if(this.state.reservation_service.flight!==null&&
                this.state.reservation_service.origin!==null&&
                this.state.reservation_service.transfer_type==="DEPARTURES"){
                    let flight_time = this.state.reservation_service.real_flight_time!==''?this.state.reservation_service.real_flight_time:this.state.reservation_service.flight_time;
                    axios.get(`${ApiOperationsUrl}reservation_token/operation_pickuptimes/`,{
                        params: {
                            token:this.state.token,
                            property:this.state.property,
                            flight_time:flight_time,
                            hotel:this.state.reservation_service.origin,
                        }
                    })
                    .then(res => {
                        if(res.data.pick_up!==null){
                            this.setState(function (prevState) {
                                return {
                                    reservation_service: {
                                        ...prevState.reservation_service,
                                        pick_up_time:res.data.pick_up.id,
                                        pick_up_time_data:res.data.pick_up.time
                                    },
                                };
                            });
                        } else {
                            this.setState(function (prevState) {
                                return {
                                    reservation_service: {
                                        ...prevState.reservation_service,
                                        pick_up_time:null,
                                        pick_up_time_data:""
                                    },
                                };
                            });
                        }
                    });
            }
        }
    }

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "flight":
                options = this.state.options_flights;
                break;
            default:
                options = this.state.options_hotels;
                break;

        }
        value = options.find((option)=>option.value===this.state.reservation_service[field]);
        return value;
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
		if(this.props.handleSave)
			this.props.handleSave(this.state.reservation_service, this.state.index);
	}

    minDate(reservation_date,date,id){
        if(date!==""&&Date.parse(reservation_date)>Date.parse(date)&&id!==null){
            return date;
        }
        return reservation_date;
    }
    
    enableDate(reservation_date,date,id){
        if(date!==""&&Date.parse(reservation_date)>Date.parse(date)&&id!==null){
            return false;
        }
        return true;
    }

    validDate(min_date,date){
        if(date===""||date===null)
            return true;
        return Date.parse(date)>=Date.parse(min_date);
    }

	render(){
		const { reservation_service,reservation_date,options_hotels,options_flights } = this.state;
        const select_option_origin = reservation_service!==null?this.getOptionValue("origin"):null;
        const select_option_destination = reservation_service!==null?this.getOptionValue("destination"):null;
        const select_option_flight = reservation_service!==null?this.getOptionValue("flight"):null;
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
		return(
			<Modal
				isOpen={reservation_service!==null}
				backdrop="static"
                size='lg'
				keyboard={false}>
				<ModalHeader><div className="text-center">Servicio de traslado</div></ModalHeader>
				<ModalBody>
                    {reservation_service!==null?
					<Form onSubmit={this.onSubmit} id="service-form">
                        <Row>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="transfer_type" size='sm'>Tipo de traslado</Label>
                                    <Input type="select"
                                        name="transfer_type"
                                        bsSize="sm"
                                        placeholder="Tipo de traslado"
                                        value={reservation_service.transfer_type}
                                        onChange={this.onChangeValue}
                                        required>
                                            <option value={'DEPARTURES'}>Salida</option>
                                            <option value={'ARRIVALS'}>Llegada</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Adultos</Label>
                                    <Input type="number"
                                        bsSize="sm"
                                        placeholder="Adultos"
                                        min={0}
                                        name="adults"
                                        value={reservation_service.adults}
                                        disabled/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Menores</Label>
                                    <Input type="number"
                                        bsSize="sm"
                                        placeholder="Menores"
                                        min={0}
                                        name="childs"
                                        value={reservation_service.childs}
                                        disabled/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label for="date" size='sm'>Fecha traslado</Label>
                                    <Input type="date"
                                        name="date"
                                        id="date"
                                        bsSize="sm"
                                        placeholder="Fecha"
                                        min={this.minDate(reservation_date,reservation_service.date,reservation_service.id)}
                                        disabled={!this.enableDate(reservation_date,reservation_service.date,reservation_service.id)}
                                        value={reservation_service.date}
                                        onChange={this.onChangeValue}
                                        invalid={!this.validDate(this.minDate(reservation_date,reservation_service.date,reservation_service.id),reservation_service.date)}
                                        required/>
                                    {this.validDate(this.minDate(reservation_date,reservation_service.date,reservation_service.id),reservation_service.date)?<></>:
                                    <FormFeedback>
                                        La fecha no es valida para reserva
                                    </FormFeedback>}
                                </FormGroup>
                            </Col>
                            {reservation_service.transfer_type==="DEPARTURES"||reservation_service.transfer_type==="INTERHOTEL"?
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Hotel {reservation_service.transfer_type==="INTERHOTEL"?"de salida":""}</Label>
                                    <Select styles={customSelectStyles}
                                        options={options_hotels}
                                        name="origin"
                                        value={select_option_origin}
                                        onChange={this.onChangeSelectValue}
                                        required/>
                                </FormGroup>
                            </Col>
                            :<></>}
                            {reservation_service.transfer_type==="ARRIVALS"||reservation_service.transfer_type==="INTERHOTEL"?
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Hotel {reservation_service.transfer_type==="INTERHOTEL"?"de llegada":""}</Label>
                                    <Select styles={customSelectStyles}
                                        options={options_hotels}
                                        name="destination"
                                        value={select_option_destination}
                                        onChange={this.onChangeSelectValue}
                                        required/>
                                </FormGroup>
                            </Col>
                            :<></>}
                            {reservation_service.transfer_type==="ARRIVALS"||reservation_service.transfer_type==="DEPARTURES"?
                            <>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label size='sm'>Vuelo </Label>
                                    <Select styles={customSelectStyles}
                                        options={options_flights}
                                        isClearable={true}
                                        isSearchable={true}
                                        name="flight"
                                        value={select_option_flight}
                                        onChange={this.onChangeSelectFlightValue}
                                        
                                    />
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Hora de vuelo</Label>
                                    <Input type="time"
                                        bsSize="sm"
                                        value={reservation_service.flight_time}
                                        disabled/>
                                </FormGroup>
                            </Col>
                            </>
                            :<Col></Col>}
                            {reservation_service.transfer_type==="DEPARTURES"||reservation_service.transfer_type==="INTERHOTEL"?
                            <>
                            {reservation_service.transfer_type==="DEPARTURES"?
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Pick Up Vuelo</Label>
                                    <Input type="time"
                                        bsSize="sm"
                                        value={reservation_service.pick_up_time_data}
                                        disabled/>
                                </FormGroup>
                            </Col>
                            :<Col></Col>}
                            </>
                            :<Col></Col>}
                            <Col sm={12}>
                                <FormGroup>
                                    <Label for="comments" size='sm'>Comentarios</Label>
                                    <Input type="textarea" 
                                        name="comments"
                                        bsSize="sm" 
                                        placeholder="Comentarios" 
                                        value={reservation_service.comments}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col></Col>
                        </Row>
                    </Form>:<></>}
				</ModalBody>
				<ModalFooter>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='service-form' disabled={reservation_service!==null&&parseInt(reservation_service.adults)===0&&parseInt(reservation_service.childs)===0}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalOperationReservationToken {...props} history={history} />;
}