import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class PaymentMethodForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSwitchValueCharge = this.onChangeSwitchValueCharge.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                name: "",
                payment_type: null,
                room_charge: false,
                card_charge: false,
                store_card_charge: false,
                courtesy: false,
                is_service_fee: false
            },
            options: [],
            modal:{
                title: "Forma de pago",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"VP",
                data:null
            },
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

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeSwitchValueCharge(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    currency:'USD',
                    [event.target.name]:event.target.checked,
				},
			};
		},()=>{
            if(event.target.name==="room_charge")
                this.setState(function (prevState) {
                    return {
                        data: {
                            ...prevState.data,
                            card_charge: false,
                            store_card_charge: false,
                        },
                    };
                });
            if(event.target.name==="card_charge")
                this.setState(function (prevState) {
                    return {
                        data: {
                            ...prevState.data,
                            room_charge: false,
                            store_card_charge: false,
                        },
                    };
                });
            if(event.target.name==="store_card_charge")
                this.setState(function (prevState) {
                    return {
                        data: {
                            ...prevState.data,
                            card_charge: false,
                            room_charge: false,
                        },
                    };
                });

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
            axios.put(`${ApiUrl}sales/payment_methods/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}sales/payment_methods/`, this.state.data)
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
                    this.props.history('/catalogs/payment_method/'+res.data.id)
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
        } else if(error.response.data.hasOwnProperty('error')){
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
        if (id !== null){
            axios.get(`${ApiUrl}sales/payment_methods/${id}/`)
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
                    }
                });
                this.options_load();
            }); 
        } else {
            this.setState({
                id:null,
                data:{
                    name: "",
                    payment_type: null,
                    room_charge: false,
                    card_charge: false,
                    store_card_charge: false,
                    courtesy: false,
                    is_service_fee: false,
                    property:null
                },
                modal_properties:{
                    type:'property',
                    isopen:false,
                    filter:"VP",
                    data:null
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}sales/payment_types/?limit=500`)
        .then(res => {
            this.setState({
                options:res.data.results.map((payment_type)=>{return {value:payment_type.id, label:payment_type.name }})
            });
        });
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
        this.props.history('/catalogs/payment_methods');
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
        this.props.history('/catalogs/payment_method/')
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
        let value = this.state.options.find((option)=>option.value===this.state.data[field]);
        return value?value:null;
    }

    render(){
        const { id,data,modal,modal_properties,options } = this.state;
        const select_option_payment_type = this.getOptionValue('payment_type');
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Nombre</Label>
                                <Input type="text" 
                                    name="name"
                                    placeholder="Nombre" 
                                    value={data.name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Tipo de forma de pago</Label>
                                <Select
                                    options={options}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Seleccione tipo de forma de pago"}
                                    name="payment_type"
                                    value={select_option_payment_type}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Moneda</Label>
                                <Input type="select" 
                                    name="currency"  
                                    placeholder="Moneda" 
                                    value={data.currency}
                                    disabled={data.room_charge===true||data.card_charge===true||data.store_card_charge===true}
                                    onChange={this.onChangeValue}>
                                        <option value={'MN'}>M.N.</option>
                                        <option value={'USD'}>USD</option>
                                        <option value={'EURO'}>EURO</option>
                                </Input>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="room_charge"
                                    checked={data.room_charge}
                                    disabled={data.card_charge===true||data.store_card_charge===true}
                                    onChange={this.onChangeSwitchValueCharge}/>
                                <Label check>Cargo Habitacion</Label>
                            </FormGroup>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="card_charge"
                                    checked={data.card_charge}
                                    disabled={data.room_charge===true||data.store_card_charge===true}
                                    onChange={this.onChangeSwitchValueCharge}/>
                                <Label check>Cargo a Tarjeta de credito</Label>
                            </FormGroup>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="store_card_charge"
                                    checked={data.store_card_charge}
                                    disabled={data.room_charge===true||data.card_charge===true}
                                    onChange={this.onChangeSwitchValueCharge}/>
                                <Label check>Cargo a Monedero</Label>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="courtesy"
                                    checked={data.courtesy}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>Cortesia</Label>
                            </FormGroup>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="is_service_fee"
                                    checked={data.is_service_fee}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>Service Fee</Label>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <PaymentMethodForm {...props} params = {params} history={history} />;
}