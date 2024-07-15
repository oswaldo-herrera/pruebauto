import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, CardGroup, Card, CardHeader, CardBody, CardTitle, CardText, CardFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import Select from 'react-select';
class SchedulePickUpForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                time: "",
                hotel: null,
                schedule:null,
            },
            options_hotels:[],
            modal:{
                title: "Tarifa",
                type: 'success',
                message: null,
            }
        }
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

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.name]:value,
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}sales/schedule_pickups/${this.state.id}/`, this.state.data)
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
                }).catch(this.catchDateError);
        } else {
            axios.post(`${ApiUrl}sales/schedule_pickups/`, this.state.data)
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
                }).catch(this.catchDateError);
        }
    }

    catchDateError = (error) =>{
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
        let id = this.props.id?this.props.id:null;
        let schedule = this.props.schedule?this.props.schedule:null;
        this.reset(id);
        if (schedule){
            this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        schedule:schedule,
                    },
                };
            });
        }
        
	}

	componentDidUpdate(prevProps, prevState) {
        if(this.props.id !== this.state.id){
			this.reset(this.props.id);
		}
        if (this.props.schedule !== this.state.data.schedule) {
			this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        schedule:this.props.schedule,
                    },
                    schedule:null
                };
            });
		}
        console.log(this.state.data)
	}

    reset(id){
        if(id !== null){
            axios.get(`${ApiUrl}sales/schedule_pickups/${id}/`)
            .then(res => {
                this.setState({
                    id:id,
                    data:res.data,
                });
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:id,
                    data: {
                        ...prev_State.data,
                        time: "",
                        hotel: null,
                    },
                };
            });
        }
        this.options_load();
    }

    options_load(){
        axios.get(`${ApiUrl}general/hotels/?limit=500`)
        .then(res => {
            this.setState({
                options_hotels:res.data.results.map((hotel)=>{return {value:hotel.id,label:hotel.name}})
            });
        });
    }

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "hotel":
                options = this.state.options_hotels;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
        }
        return value;
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

    render(){
        const { data,modal,options_hotels } = this.state;
        const select_option_hotel = this.getOptionValue("hotel");
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Hotel</Label>
                                <Select
                                    options={options_hotels}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="hotel"
                                    value={select_option_hotel}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Pick Up</Label>
                                <Input type="time"
                                    name="time"
                                    placeholder="Pick Up" 
                                    value={data.time}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit" className='mt-3'>
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalAlert handleClose={this.handleClose} handleCloseError={this.handleCloseError} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <SchedulePickUpForm {...props} params = {params} history={history} />;
}