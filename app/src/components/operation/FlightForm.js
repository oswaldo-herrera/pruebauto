import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, CardGroup, Card, CardHeader, CardBody, CardTitle, CardText, Table } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class FlightForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeValueSchedule = this.onChangeValueSchedule.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                flight_type: "arrival",
                start_date: "",
                due_date: "",
                code:"",
                origin:"",
                destination:"",
                mon_arrival:null,
                tue_arrival:null,
                wed_arrival:null,
                thu_arrival:null,
                fri_arrival:null,
                sat_arrival:null,
                sun_arrival:null,
                mon_departure:null,
                tue_departure:null,
                wed_departure:null,
                thu_departure:null,
                fri_departure:null,
                sat_departure:null,
                sun_departure:null,
            },
            modal:{
                title: "Tarifa",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"OP",
                value:null
            },
        }
    }

    onClearInput(field){
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    [field]:null,
                },
            };
        });
    }

    onChangeValue(event) {
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    [event.target.name]:event.target.value,
                },
            };
        });
    }

    onChangeValueSchedule(event,schedule) {
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    [schedule]:{
                        ...prevState.data[schedule],
                        [event.target.name]:event.target.value,
                    }
                },
            };
        });
    }

    onChangeSwitchValue(event,schedule) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [schedule]:{
                        ...prevState.data[schedule],
                        [event.target.name]:event.target.checked,
                    }
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        if(this.state.id===null || this.state.data.property===null){
            this.setState(function (prev_State) {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: true,
                    },
                };
            });
        } else {
            this.SaveModelForm()
        }
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

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    data:{
                        ...prev_State.data,
                        property:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}operations/flights/${this.state.id}/`, this.state.data)
                .then(res => {
                    this.reset(res.data.id);
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                        };
                    });
                }).catch(this.catchError);
        } else {
            axios.post(`${ApiUrl}operations/flights/`, this.state.data)
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
                }).catch(this.catchError);
        }
    }

    catchError = (error) =>{
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
        } else if(error.response.data.hasOwnProperty('due_date') > -1){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.due_date,
                    },
                };
            });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
		this.reset(id);        
	}

	componentDidUpdate(prevProps, prevState) {
        if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    reset(id){
        if(id !== null){
            axios.get(`${ApiUrl}operations/flights/${id}/`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        data:res.data,
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.data.property,
                        },
                    };
                });
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:id,
                    data: {
                        ...prev_State.data,
                        flight_type: "arrival",
                        start_date: "",
                        due_date: "",
                        code:"",
                        origin:"",
                        destination:"",
                        mon_arrival:null,
                        tue_arrival:null,
                        wed_arrival:null,
                        thu_arrival:null,
                        fri_arrival:null,
                        sat_arrival:null,
                        sun_arrival:null,
                        mon_departure:null,
                        tue_departure:null,
                        wed_departure:null,
                        thu_departure:null,
                        fri_departure:null,
                        sat_departure:null,
                        sun_departure:null,
                    },
                    modal_properties:{
                        type:'property',
                        isopen:false,
                        value:null
                    },
                };
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
        if(this.props.handleSave)
            this.props.handleSave();
	}

    handleCloseAddMore = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                id:null
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

    time_component(field,data,enabled){
        return(
        <div style={{display:"flex"}}>
            <Input type="time"
                bsSize={'sm'}
                name={field}
                value={data?data:""}
                disabled={!enabled}
                onChange={this.onChangeValue}/>
            <Button size='xs' outline onClick={()=>{this.onClearInput(field)}}><i className="bi bi-x"></i></Button>
        </div>)
    }

    render(){
        const { id,data,modal,modal_properties } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Periodo de inicio</Label>
                                <Input type="date" 
                                    name="start_date"
                                    placeholder="Periodo de inicio" 
                                    value={data.start_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Periodo de fin</Label>
                                <Input type="date" 
                                    name="due_date"
                                    placeholder="Periodo de fin" 
                                    value={data.due_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Tipo de vuelo</Label>
                                <Input type="select" 
                                    name="flight_type"  
                                    placeholder="Tipo de vuelo" 
                                    value={data.flight_type}
                                    onChange={this.onChangeValue}>
                                        <option value={'departure'}>Salida</option>
                                        <option value={'arrival'}>Llegada</option>
                                        <option value={'both'}>Ambos</option>
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Codigo de vuelo</Label>
                                <Input type="text" 
                                    name="code"
                                    placeholder="Codigo de vuelo" 
                                    value={data.code}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Origen</Label>
                                <Input type="text" 
                                    name="origin"
                                    placeholder="Origen" 
                                    value={data.origin}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Destino</Label>
                                <Input type="text" 
                                    name="destination"
                                    placeholder="Destino" 
                                    value={data.destination}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={12}>
                            <Table size='sm' bordered>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>LUNES</th>
                                        <th>MARTES</th>
                                        <th>MIERCOLES</th>
                                        <th>JUEVES</th>
                                        <th>VIERNES</th>
                                        <th>SABADO</th>
                                        <th>DOMINGO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th scope="row">
                                            LLEGADA
                                        </th>
                                        <td>{this.time_component('mon_arrival',data.mon_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                        <td>{this.time_component('tue_arrival',data.tue_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                        <td>{this.time_component('wed_arrival',data.wed_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                        <td>{this.time_component('thu_arrival',data.thu_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                        <td>{this.time_component('fri_arrival',data.fri_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                        <td>{this.time_component('sat_arrival',data.sat_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                        <td>{this.time_component('sun_arrival',data.sun_arrival,data.flight_type==="both"||data.flight_type==="arrival")}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">
                                            SALIDA
                                        </th>
                                        <td>{this.time_component('mon_departure',data.mon_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                        <td>{this.time_component('tue_departure',data.tue_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                        <td>{this.time_component('wed_departure',data.wed_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                        <td>{this.time_component('thu_departure',data.thu_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                        <td>{this.time_component('fri_departure',data.fri_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                        <td>{this.time_component('sat_departure',data.sat_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                        <td>{this.time_component('sun_departure',data.sun_departure,data.flight_type==="both"||data.flight_type==="departure")}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>   
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit" className='mt-3'>
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <ModalAlert handleClose={this.handleClose} handleCloseError={this.handleCloseError} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <FlightForm {...props} params = {params} history={history} />;
}