import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, CardGroup, Card, CardHeader, CardBody, CardTitle, CardText, Table } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import Select from 'react-select';
class PickUpForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                hotel: null,
                pickuptimes:this.pickuptimes_data(),
            },
            options_hotels: [],
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

    pickuptimes_data(){
        var data = [],
            i = 0;
        while(i < 24){
            data.push({
                'key':i,
                time:null
            })
            i++;
        }
        return data
    }

    onClearInputItem(i){
        var pickuptimes = this.state.data.pickuptimes;
        pickuptimes[i].time = null;
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    pickuptimes:pickuptimes
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

    onChangeValueTime(event,i) {
        var pickuptimes = this.state.data.pickuptimes;
        pickuptimes[i].time = event.target.value;
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    pickuptimes:pickuptimes
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
            axios.put(`${ApiUrl}operations/pick_ups/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}operations/pick_ups/`, this.state.data)
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
        console.log(this.state.data);
        if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    reset(id){
        if(id !== null){
            axios.get(`${ApiUrl}operations/pick_ups/${id}/`)
            .then(res => {
                res.data.pickuptimes = res.data.pickuptimes.map((pickuptime, index)=> Object.assign({key:index},pickuptime));
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
                this.options_load();
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:id,
                    data: {
                        ...prev_State.data,
                        hotel: null,
                        pickuptimes:this.pickuptimes_data(),
                    },
                    modal_properties:{
                        type:'property',
                        isopen:false,
                        value:null
                    },
                };
            });
            this.options_load();
        }
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

    pickuptime_component(field,data,i){
        return(
        <div style={{display:"flex"}} key={i}>
            <Input type="time"
                bsSize={'sm'}
                name={field}
                value={data?data:""}
                onChange={(e)=>this.onChangeValueTime(e,i)}/>
            <Button size='xs' outline onClick={()=>{this.onClearInputItem(i)}}><i className="bi bi-x"></i></Button>
        </div>)
    }

    render(){
        const { id,data,modal,modal_properties,options_hotels } = this.state;
        const select_option_hotel = this.getOptionValue("hotel");
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Hotel</Label>
                                <Select
                                    options={options_hotels}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="hotel"
                                    value={select_option_hotel}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={12}>
                            <div className='table-scroll'>
                                <div className='table-wrap'>
                                    <Table size='sm' responsive bordered>
                                        <thead>
                                            <tr>
                                                <th width={"12%"}>Hora de vuelo</th>
                                                <th scope="col">00:31</th>
                                                <th scope="col">01:31</th>
                                                <th scope="col">02:31</th>
                                                <th scope="col">03:31</th>
                                                <th scope="col">04:31</th>
                                                <th scope="col">05:31</th>
                                                <th scope="col">06:31</th>
                                                <th scope="col">07:31</th>
                                                <th scope="col">08:31</th>
                                                <th scope="col">09:31</th>
                                                <th scope="col">10:31</th>
                                                <th scope="col">11:31</th>
                                                <th scope="col">12:31</th>
                                                <th scope="col">13:31</th>
                                                <th scope="col">14:31</th>
                                                <th scope="col">15:31</th>
                                                <th scope="col">16:31</th>
                                                <th scope="col">17:31</th>
                                                <th scope="col">18:31</th>
                                                <th scope="col">19:31</th>
                                                <th scope="col">20:31</th>
                                                <th scope="col">21:31</th>
                                                <th scope="col">22:31</th>
                                                <th scope="col">23:31</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <th>
                                                    Pick up
                                                </th>
                                                {data.pickuptimes.map((pickuptime, index)=>(
                                                    <td>
                                                        {this.pickuptime_component("time",pickuptime.time,pickuptime.key)}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                            
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
    return <PickUpForm {...props} params = {params} history={history} />;
}